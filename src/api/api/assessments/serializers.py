from uuid import uuid4

from django.core.exceptions import ValidationError
from rest_framework import serializers

from api.base.serializers import BaseSerializer

from api.subjects.models import SubjectNode

from api.schools.models import Student
from api.schools.serializers import StudentSerializer

from .models import (
	Assessment, 
	AssessmentSchema,
	AssessmentType,
	RatedAttempt, 
	CompletionAttempt, CompletionState,
	UnitAssessmentSchema, 
	BlockAssessmentSchema, 
	LessonPrelearningAssessmentSchema, 
	LessonOutcomeSelfAssessmentSchema, 
)

################################
##
## Attempt
## 
################################


class AttemptSerializer(serializers.Serializer):
	@staticmethod
	def for_assessment_type(assessment_type, *args, **kwargs):
		if assessment_type in ['unit-assessment', 'block-assessment', 'lesson-outcome-self-assessment']:
			return RatedAttemptSerializer(*args, **kwargs)
		elif assessment_type == 'lesson-prelearning-assessment':
			return CompletionAttemptSerializer(*args, **kwargs)
		else:
			raise ValueError(f'Unknown assessment type \'{assessment_type}\'')

	assessment = serializers.PrimaryKeyRelatedField(queryset=Assessment.objects.all())
	assessment_type = serializers.CharField(source='assessment.type', read_only=True)
	attempt_number = serializers.IntegerField(read_only=True)	
	date = serializers.DateTimeField(read_only=True)

	def to_representation(self, instance):
		representation = {
			'type': instance.assessment.type + '-attempt'
		}
		representation.update(super().to_representation(instance))
		return representation

class RatedAttemptSerializer(AttemptSerializer):
	rating = serializers.IntegerField()
	rating_percent = serializers.FloatField()

class CompletionAttemptSerializer(AttemptSerializer):
	completion_state 		= serializers.ChoiceField(choices=CompletionState.choices)
	is_complete 			= serializers.BooleanField(read_only=True)
	is_partially_complete 	= serializers.BooleanField(read_only=True)

	def create(self, validated_data):
		return CompletionAttempt.objects.create(
			**validated_data
		)


#################################
##
## Report
##
#################################

class ReportSerializer(serializers.Serializer):
	@staticmethod
	def for_assessment_type(assessment_type, *args, **kwargs):
		if assessment_type in ['unit-assessment', 'block-assessment', 'lesson-outcome-self-assessment']:
			return RatedReportSerializer(*args, **kwargs)
		elif assessment_type == 'lesson-prelearning-assessment':
			return CompletedReportSerializer(*args, **kwargs)
		else:
			raise ValueError(f'Unknown assessment type \'{assessment_type}\'')

	type = serializers.CharField()
	assessment_type = serializers.CharField()
	generated_at  = serializers.DateTimeField()

	subject_class = serializers.UUIDField(source='subject_class.id', allow_null=True)

	school = serializers.UUIDField(source='assessment_schema.school.id')
	subject = serializers.UUIDField(source='assessment_schema.subject.id')
	node   = serializers.UUIDField(source='assessment_schema.node.id')

	total_candidate_count = serializers.IntegerField()
	candidate_ids = serializers.ListField(child=serializers.UUIDField())

	attempted_candidate_count = serializers.IntegerField()
	attempted_candidate_ids = serializers.ListField(child=serializers.UUIDField())

	percent_attempted = serializers.FloatField()

class CompletedReportSerializer(ReportSerializer):
	percent_completed = serializers.FloatField()

	completed_candidate_count = serializers.IntegerField()
	most_recent_completion_at = serializers.DateTimeField(allow_null=True)

	completed_candidate_ids = serializers.ListField(child=serializers.UUIDField())

class RatedReportSerializer(ReportSerializer):
	rating_average			= serializers.FloatField()
	rating_std_deviation 	= serializers.FloatField(source='rating_std_dev')

###################################
##
## Assessment
##
###################################

class AssessmentSerializer(serializers.Serializer):
	"""
	From the perspective of the API, there is no schema, only assessments
	for different configurations of subjects, schools and subject nodes.

	Attributes from the schema are inlined into the assessment body.
	"""

	@staticmethod
	def class_for_assessment_type(assessment_type):
		if assessment_type is None:
			return AssessmentSerializer

		if assessment_type == 'unit-assessment':
			return UnitAssessmentSerializer
		elif assessment_type == 'block-assessment':
			return BlockAssessmentSerializer
		elif assessment_type == 'lesson-prelearning-assessment':
			return LessonPrelearningAssessmentSerializer
		elif assessment_type == 'lesson-outcome-self-assessment':
			return LessonOutcomeSelfAssessmentSerializer
		else:
			raise ValueError(f'Unrecognised assessment type {assessment_type}')

	type = serializers.ChoiceField(choices=AssessmentType.choices)
	id = serializers.UUIDField(read_only=True)
	student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())

	school = serializers.UUIDField(source='schema.school.id', read_only=True)
	subject = serializers.UUIDField(source='schema.subject.id', read_only=True)
	node   = serializers.PrimaryKeyRelatedField(source='schema.node', queryset=SubjectNode.objects.all())

	created_at = serializers.DateTimeField(read_only=True)
	updated_at = serializers.DateTimeField(allow_null=True, read_only=True)


	def schema_serializer(self, instance):
		serializer_cls = schema_serializer_class_for_type(instance.type)
		return serializer_cls(instance.schema)

	def validate(self, data):
		# There must be a schema that exists for the assessment
		try:
			data['schema'] = AssessmentSchema.objects.filter(
				type=data['type'],
				school=data['student'].school,
				node=data['schema']['node']
			).get()
		except AssessmentSchema.DoesNotExist:
			raise ValidationError(
				f'Cannot create {type} assessment for student. '
			 	f'There is no assessment schema of the given type for students at {school.name}.'
			)
		return data

	def create(self, validated_data):
		a = Assessment.objects.create(
			schema_base = validated_data.get('schema'),
			student = validated_data.get('student')
		)
		# Reload to add annotations
		a = Assessment.objects_of_type(a.type).get(pk=a.pk)
		return a

class CompletionBasedAssessmentSerializer(AssessmentSerializer):
	is_attempted = serializers.BooleanField(read_only=True)
	attempted_at = serializers.DateTimeField(allow_null=True, read_only=True)

	is_complete = serializers.BooleanField(read_only=True)
	is_partially_complete = serializers.BooleanField(read_only=True)

	completion_state = serializers.ChoiceField(
		allow_null=True, 
		choices=CompletionState.choices, 
		required=False
	)

	def update(self, instance, validated_data):
		completion_state = validated_data.get('completion_state', None)
		if completion_state is not None:
			serializer = CompletionAttemptSerializer(data={
				assessment: instance.id,
				})
			attempt = CompletionAttempt(id=uuid4(), assessment=instance, completion_state=completion_state)
			attempt.save()
		return instance


class RatingsBasedAssessmentSerializer(AssessmentSerializer):
	is_attempted = serializers.BooleanField()
	attempted_at = serializers.DateTimeField()

	rating = serializers.FloatField()
	rating_percent = serializers.FloatField()

	attempts = RatedAttemptSerializer(many=True, read_only=True, source='attempt_set')

class UnitAssessmentSerializer(RatingsBasedAssessmentSerializer):
	unit = serializers.UUIDField(source='schema.unit.id', read_only=True)

class BlockAssessmentSerializer(RatingsBasedAssessmentSerializer):
	block = serializers.UUIDField(source='schema.block.id', read_only=True)

class LessonPrelearningAssessmentSerializer(CompletionBasedAssessmentSerializer):
	lesson = serializers.UUIDField(source='schema.lesson.id', read_only=True)

class LessonOutcomeSelfAssessmentSerializer(RatingsBasedAssessmentSerializer):
	lesson_outcome = serializers.UUIDField(source='schema.lessonoutcome.id', read_only=True)


