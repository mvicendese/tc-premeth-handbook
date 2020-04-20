from rest_framework import serializers

from ..models import Assessment

from .models import (
	AttemptType,
	PassFailState, PassFailAttempt,
	CompletionState, CompletionBasedAttempt,
	RatedAttempt,
	GradeState, GradedAttempt
)

class AttemptSerializer(serializers.Serializer):
	@staticmethod
	def for_attempt_type(attempt_type, *args, **kwargs):
		cls = {
			AttemptType.PASS_FAIL: PassFailAttemptSerializer,
			AttemptType.COMPLETION_BASED: CompletionBasedAttemptSerializer,
			AttemptType.GRADED: GradedAttemptSerializer,
			AttemptType.RATED: RatedAttemptSerializer
		}[attempt_type]

		return cls(*args, **kwargs)

	assessment 		= serializers.PrimaryKeyRelatedField(queryset=Assessment.objects.all())
	assessment_type = serializers.CharField(source='assessment.type', read_only=True)
	attempt_type 	= serializers.CharField(max_length=64, read_only=True)

	attempt_number  = serializers.IntegerField(read_only=True)
	created_at      = serializers.DateTimeField(read_only=True)

	@property
	def attempt_type(self):
		return type(self).Meta.attempt_type

	def validate_assessment(self, assessment):
		if assessment.schema.attempt_type != self.attempt_type:
			raise ValidationError(f'A {self.attempt_type.label} attempt cannot be directly associated with a {assessment.type} assessment')
		return assessment


class PassFailAttemptSerializer(AttemptSerializer):
	is_pass = serializers.BooleanField()

	class Meta:
		attempt_type = AttemptType.PASS_FAIL

	def create(self, validated_data):
		return PassFailAttempt.objects.create(
			assessment=validated_data['assessment'],
			state=PassFailState.PASS if validated_data['is_pass'] else PassFailState.FAIL
		)


class CompletionBasedAttemptSerializer(AttemptSerializer):
	class Meta:
		attempt_type = AttemptType.COMPLETION_BASED

	completion_state = serializers.ChoiceField(source='state', choices=CompletionState.choices)
	is_complete = serializers.BooleanField(read_only=True)
	is_partially_complete = serializers.BooleanField(read_only=True)


	def create(self, validated_data):
		return CompletionBasedAttempt.objects.create(
			assessment=validated_data['assessment'],
			state=validated_data['state']
		)



class RatedAttemptSerializer(AttemptSerializer):
	class Meta:
		attempt_type = AttemptType.RATED

	maximum_available_rating = serializers.IntegerField(read_only=True)
	rating = serializers.IntegerField()

	percent_rating = serializers.FloatField(read_only=True)

	def create(self, validated_data):
		return RatedAttempt.objects.create(
			assessment=validated_data['assessment'],
			rating=validated_data['rating']
		)



class GradedAttemptSerializer(AttemptSerializer):
	class Meta:
		attempt_type = AttemptType.GRADED

	grade = serializers.ChoiceField(choices=GradeState.choices)

	def create(self, validated_data):
		return GradedAttempt.objects.create(
			assessment=validated_data['assessment'],
			grade=validated_data['grade']
		)


