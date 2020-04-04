from rest_framework import serializers

from api.base.serializers import BaseSerializer

from api.schools.serializers import StudentSerializer

from .models import (
	Assessment, 
	RatedAttempt, CompletionAttempt,
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

	assessment = serializers.UUIDField()
	attempt_number = serializers.IntegerField(read_only=True)	
	date = serializers.DateTimeField(read_only=True)

class RatedAttemptSerializer(AttemptSerializer):
	raw_mark = serializers.IntegerField()
	mark_percent = serializers.DecimalField(5,2)

class CompletionAttemptSerializer(AttemptSerializer):
	is_completed = serializers.BooleanField()

	def create(self, validated_data):
		return CompletionAttempt.objects.create(
			assessment=Assessment.objects.get(id=validated_data['assessment']),
			is_completed=validated_data["is_completed"],
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

	subject_class = serializers.UUIDField(source='subject_class.id', allow_null=True)
	generated_at  = serializers.DateTimeField()

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
	pass

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

	type = serializers.CharField()
	id = serializers.UUIDField()
	student = serializers.UUIDField(source='student_id')

	school = serializers.UUIDField(source='schema.school.id')
	subject = serializers.UUIDField(source='schema.subject.id')
	node   = serializers.UUIDField(source='schema.node.id')

	def schema_serializer(self, instance):
		serializer_cls = schema_serializer_class_for_type(instance.type)
		return serializer_cls(instance.schema)

class CompletionBasedAssessmentSerializer(AssessmentSerializer):
	is_attempted = serializers.BooleanField()
	attempted_at = serializers.DateTimeField(allow_null=True)

	is_completed = serializers.BooleanField()

class RatingsBasedAssessmentSerializer(AssessmentSerializer):
	is_attempted = serializers.BooleanField()
	attempted_at = serializers.DateTimeField()

	rating = serializers.FloatField()
	rating_percent = serializers.FloatField()

	best_raw_mark = serializers.IntegerField(allow_null=True)
	best_mark_percent = serializers.FloatField()
	best_at = serializers.DateTimeField(allow_null=True)

	attempts = RatedAttemptSerializer(many=True, read_only=True, source='attempt_set')

class UnitAssessmentSerializer(RatingsBasedAssessmentSerializer):
	unit = serializers.UUIDField(source='schema.unit.id')

class BlockAssessmentSerializer(RatingsBasedAssessmentSerializer):
	block = serializers.UUIDField(source='schema.block.id')

class LessonPrelearningAssessmentSerializer(CompletionBasedAssessmentSerializer):
	lesson = serializers.UUIDField(source='schema.lesson.id')

class LessonOutcomeSelfAssessmentSerializer(RatingsBasedAssessmentSerializer):
	lesson_outcome = serializers.UUIDField(source='schema.lesson_outcome.id')


