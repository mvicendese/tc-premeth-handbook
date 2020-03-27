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

class AttemptSerializer(serializers.Serializer):

	class _Attempt(serializers.Serializer):
		assessment = serializers.UUIDField()
		attempt_number = serializers.IntegerField()	
		date = serializers.DateTimeField()

	class MarkedAttempt(_Attempt):
		raw_mark = serializers.IntegerField()
		modelark_percent = serializers.DecimalField(5,2)

	class UnitAssessmentAttempt(MarkedAttempt):
		class Meta:
			model = UnitAssessmentAttempt
			model_name = 'unit-assessment-attempt'

	class BlockAssessmentAttempt(MarkedAttempt): 
		class Meta:
			model = BlockAssessmentAttempt
			model_name = 'block-assessment-attempt'


class AttemptAggregateSerializer:
	class _AttemptAggregate(serializers.Serializer):
		pass

	class Marked(_AttemptAggregate):
		is_attempted = serializers.BooleanField()
		best_raw_mark = serializers.IntegerField(allow_null=True)
		best_mark_percent = serializers.DecimalField(5, 2, allow_null=True)
		best_at = serializers.DateTimeField(allow_null=True)

		attempts = AttemptSerializer.MarkedAttempt(many=True, read_only=True)

	class RatingsBased(_AttemptAggregate):
		is_rated = serializers.BooleanField()
		rating = serializers.IntegerField()
		rated_at = serializers.DateTimeField(allow_null=True)

	class CompletionBased(_AttemptAggregate):
		is_completed = serializers.BooleanField()
		completed_at = serializers.DateTimeField(allow_null=True)

		def to_representation(self, obj):
			print('OBJECT', obj, dir(obj))
			return super().to_representation(obj)

class ReportSerializer:
	def __new__(cls, report, *args, **kwargs):
		assessment_type = report.get('assessment_type', None)

		if assessment_type == 'unit-assessment':
			return cls.Marked(*args, **kwargs)
		elif assessment_type == 'lesson-prelearning-assessment':
			return cls.CompletionBased(*args, **kwargs)
		else:
			raise ValueError(f'Unrecognised assessment type {assessment_type}')

	class _Report(serializers.Serializer):
		def to_representation(self, instance):
			return SchemaSerializer(instance.type).report_to_representation(
				instance,
				lambda instance: super().to_representation(instance)
			)

	class Marked(_Report):
		pass

	class CompletionBased(_Report):
		students_completed_count = serializers.IntegerField()

		most_recent_completion_at = serializers.DateTimeField()
		most_recent_completion_by = StudentSerializer()

		completed_student_ids = serializers.ListField(serializers.UUIDField())

class SchemaSerializer:
	@classmethod
	def _schema_class(cls, assessment_type):
		if assessment_type == 'unit-assessment':
			return cls.UnitAssessment
		elif assessment_type == 'lesson-prelearning-assessment':
			return cls.LessonPrelearning
		else:
			raise ValueError('Unrecognised assessment type')

	@classmethod
	def _attempt_class(cls, assessment_type):
		schema_cls = cls._schema_class(assessment_type)
		return getattr(schema_cls.Meta, 'attempt_class', None)

	@classmethod
	def _attempt_aggregate_class(cls, assessment_type):
		schema_cls = cls._schema_class(assessment_type)
		return schema_cls.Meta.attempt_aggregate_class

	@classmethod
	def _report_class(cls, assessment_type):
		schema_cls = cls._schema_class(assessment_type)
		return schema_cls.Meta.report_class


	def __new__(cls, assessment_type, *args, **kwargs):
		schema_cls = cls._schema_class(assessment_type)
		return schema_cls(*args, **kwargs)

	@classmethod
	def assessment_to_representation(cls, assessment, instance_cb=None):
		schema_serializer = cls(assessment.type, assessment.schema)
		representation = schema_serializer.data

		if not instance_cb:
			raise ValueError('An instance callback must be provided')
		representation.update(instance_cb())

		attempt_aggregate_class = cls._attempt_aggregate_class(assessment.type)
		representation.update(attempt_aggregate_class(assessment).data)


		attempt_cls = cls._attempt_class(assessment.type)
		if attempt_cls is not None:
			attempt_serializer = attempt_cls(many=True, read_only=True)
			representation.update(
				attempts=[
					attempt_serializer.to_representation(attempt)
					for attempt in instance.attempt_set.all()
				]
			)
		return representation

	@classmethod
	def report_to_representation(cls, report, instance_cb=None):
		report_cls = cls.Meta.report_class
		return report_cls(report).data

	class _Schema(serializers.Serializer):
		school  = serializers.UUIDField(source='school_id')
		subject = serializers.UUIDField(source='subject.id')
		type 	= serializers.CharField(read_only=True)
		node 	= serializers.UUIDField(source='subject.id')

	class UnitAssessment(_Schema):
		unit = serializers.UUIDField()

		class Meta:
			report_class = ReportSerializer.Marked
			attempt_aggregate_class = AttemptAggregateSerializer.Marked

	class LessonPrelearning(_Schema):
		lesson = serializers.UUIDField()

		class Meta: 
			report_class = ReportSerializer.CompletionBased
			attempt_aggregate_class = AttemptAggregateSerializer.CompletionBased

class AssessmentSerializer(serializers.Serializer):
	id = serializers.UUIDField()
	student = serializers.UUIDField(source='student_id')

	def to_representation(self, instance):
		assessment_type = instance.type
		_super = super()
		return SchemaSerializer.assessment_to_representation(
			instance,
			lambda: _super.to_representation(instance)
		)

