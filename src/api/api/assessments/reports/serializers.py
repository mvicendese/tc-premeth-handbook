from rest_framework import serializers

from api.base.serializers import DocumentSerializer

from api.schools.models import SubjectClass
from api.subjects.models import SubjectNode

from ..models import AttemptType



def RelatedStudentsField():
	return serializers.ListField(
		child=serializers.PrimaryKeyRelatedField(read_only=True)
	)

class ReportSerializer(DocumentSerializer):
	@staticmethod
	def for_attempt_type(attempt_type, *args, **kwargs):
		cls = {
			AttemptType.PASS_FAIL: PassFailReportSerializer,
			AttemptType.COMPLETION_BASED: CompletionBasedReportSerializer,
			AttemptType.GRADED: GradedReportSerializer,
			AttemptType.RATED: RatedReportSerializer
		}[attempt_type]
		return cls(*args, **kwargs)

	assessment_type = serializers.CharField()

	subject_node	= serializers.PrimaryKeyRelatedField(queryset=SubjectNode.objects.all())
	subject_class   = serializers.PrimaryKeyRelatedField(queryset=SubjectClass.objects.all())

	school = serializers.PrimaryKeyRelatedField(source='assessment_schema.school', read_only=True)
	subject = serializers.PrimaryKeyRelatedField(source='assessment_schema.subject', read_only=True)

	candidates = RelatedStudentsField()
	candidate_count = serializers.IntegerField()

	attempted_candidates = RelatedStudentsField()
	attempted_candidate_count = serializers.IntegerField()

	percent_attempted = serializers.FloatField()


class PassFailReportSerializer(ReportSerializer):
	passed_candidates = RelatedStudentsField()
	passed_candidate_count = serializers.IntegerField()

	percent_passed = serializers.FloatField()


class CompletionBasedReportSerializer(ReportSerializer):
	partially_complete_candidates = RelatedStudentsField()
	partially_complete_candidate_count = serializers.IntegerField()

	complete_candidates = RelatedStudentsField()
	complete_candidate_count = serializers.IntegerField()

	percent_partially_complete = serializers.FloatField()	
	percent_complete = serializers.FloatField()



class GradedReportSerializer(ReportSerializer):
	class Grade(serializers.Serializer):
		grade = serializers.CharField()
		candidates = RelatedStudentsField()
		candidate_count = serializers.IntegerField()

	def to_representation(self, instance):
		representation = super().to_representation(instance)
		for grade in GradeState.values:
			representation[str(grade)] = GradedReportSerializer.Grade(
				instance.candidate_grades[grade], 
				data={'grade': str(grade)}
			).data
		return representation


class RatedReportSerializer(ReportSerializer):
	candidate_ratings = serializers.DictField(
		child=serializers.IntegerField(),
		read_only=True
	)

	rating_average = serializers.DecimalField(decimal_places=2, max_digits=5, read_only=True)
	rating_std_dev = serializers.DecimalField(decimal_places=2, max_digits=5, read_only=True)

