from rest_framework import serializers

from api.base.serializers import BaseSerializer

from api.schools.serializers import StudentSerializer

from .models import (
	Assessment,
	UnitAssessmentSchema, UnitAssessmentAttempt,
	BlockAssessmentSchema, BlockAssessmentAttempt,
	LessonPrelearningAssessmentSchema, LessonPrelearningAssessmentAttempt,
	LessonOutcomeSelfAssessmentSchema, LessonOutcomeSelfAssessmentAttempt
)

################################
##
## Attempt
## 
################################


class AttemptSerializer(serializers.Serializer):
	assessment = serializers.UUIDField()
	attempt_number = serializers.IntegerField()	
	date = serializers.DateTimeField()

class AttemptAggregateSerializer(serializers.Serializer):
	pass

class MarkedAttemptSerializer(AttemptSerializer):
	raw_mark = serializers.IntegerField()
	mark_percent = serializers.DecimalField(5,2)


class UnitAssessmentAttempt(MarkedAttemptSerializer):
	class Meta:
		model = UnitAssessmentAttempt
		model_name = 'unit-assessment-attempt'


class BlockAssessmentAttempt(MarkedAttemptSerializer): 
	class Meta:
		model = BlockAssessmentAttempt
		model_name = 'block-assessment-attempt'


#################################
##
## Assessment attempt aggregates
##
#################################

class AssessmentAttemptAggregateSerializer(serializers.Serializer):
	"""
	Inlines information about all the attempts that have been
	made on the assessment into the serialized assessment.
	"""
	pass

class CompletedAttemptAggregateSerializer(AssessmentAttemptAggregateSerializer):
	pass	

class MarkedAttemptAggregatesSerializer(AttemptAggregateSerializer):
	is_attempted = serializers.BooleanField()
	best_raw_mark = serializers.IntegerField(allow_null=True)
	best_mark_percent = serializers.DecimalField(5, 2, allow_null=True)
	best_at = serializers.DateTimeField(allow_null=True)

	attempts = MarkedAttemptSerializer(many=True, read_only=True)

#################################
##
## Report
##
#################################

class ReportSerializer(serializers.Serializer):
	assessment_type = serializers.CharField()

	subject_class = serializers.UUIDField(source='subject_class.id', allow_null=True)
	generated_at  = serializers.DateTimeField()

	total_candidate_count = serializers.IntegerField()
	attempted_candidate_count = serializers.IntegerField()

	not_attempted_candidate_ids = serializers.ListField(child=serializers.UUIDField())

	def to_representation(self, instance):
		schema_serializer = SchemaSerializer(instance.schema, type_suffix='-report')
		representation = schema_serializer.data	
		representation.update(super().to_representation(instance))
		return representation

class MarkedReportSerializer(serializers.Serializer):
	pass

class CompletedReportSerializer(serializers.Serializer):
	percentage_complete = serializers.DecimalField(5, 3)

	completed_candidate_count = serializers.IntegerField()
	most_recent_completion_at = serializers.DateTimeField(allow_null=True)

	completed_candidate_ids = serializers.ListField(child=serializers.UUIDField())

class RatedReportSerializer(serializers.Serializer):
	pass

###################################
##
## Schema
## 
###################################

class SchemaSerializer(serializers.Serializer):
	school = serializers.UUIDField(source='school.id')
	subject = serializers.UUIDField(source='subject.id')
	node   = serializers.UUIDField(source='node.id')

	def __init__(self, *args, type_suffix='', **kwargs):
		super().__init__(*args, **kwargs)
		self.type_suffix = type_suffix

	def to_representation(self, instance):
		representation = {
			'type': instance.type + self.type_suffix
		}
		representation.update(super().to_representation(instance))
		return representation

	def attempt_aggregates_to_representation(self, assessment):
		raise NotImplementedError('attempt_aggregates_to_representation')

class CompletedAssessmentSchemaSerializer(SchemaSerializer):
	pass

class RatedAssessmentSchemaSerializer(SchemaSerializer):
	pass

class MarkedAssessmentSchemaSerializer(SchemaSerializer):
	pass

###################################
## 
## Leaf types
##
###################################


class UnitAssessmentSchemaSerializer(MarkedAssessmentSchemaSerializer):
	unit = serializers.UUIDField()

	def attempt_aggregates_to_representation(self, assessment):
		return MarkedAttemptAggregateSerializer(assessment).data

class BlockAssessmentSchemaSerializer(MarkedAssessmentSchemaSerializer):
	block = serializers.UUIDField()

class LessonPrelearningSchemaSerializer(CompletedAssessmentSchemaSerializer):
	lesson = serializers.UUIDField()

	def attempt_aggregates_to_representation(self, assessment):
		return CompletedAttemptAggregateSerializer(assessment).data

class LessonOutcomeSelfAssessmentSchemaSerializer(RatedAssessmentSchemaSerializer):
	lesson_outcome = serializers.UUIDField()

	def attempt_aggregates_to_representation(self, assessment):
		return RatedAssessmentSchemaSerializer(assessment).data

def schema_serializer_class_for_type(assessment_type):
	if assessment_type == 'unit-assessment':
		return UnitAssessmentSchemaSerializer	
	elif assessment_type == 'block-assessment':
		return BlockAssessmentSchemaSerializer
	elif assessment_type == 'lesson-prelearning-assessment':
		return LessonPrelearningSchemaSerializer
	elif assessment_type == 'lesson-outcome-self-assessment':
		return LessonOutcomeSelfAssessmentSchemaSerializer
	else:
		raise ValueError(f'Unrecognised assessment type \'{0}\'')

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

	id = serializers.UUIDField()
	student = serializers.UUIDField(source='student_id')

	def schema_serializer(self, instance):
		serializer_cls = schema_serializer_class_for_type(instance.type)
		return serializer_cls(instance.schema)

	def to_representation(self, instance):

		schema_serializer = self.schema_serializer(instance)
		representation = schema_serializer.data

		representation.update(super().to_representation(instance))

		representation.update(
			schema_serializer.attempt_aggregates_to_representation(instance)
		)

		return representation
