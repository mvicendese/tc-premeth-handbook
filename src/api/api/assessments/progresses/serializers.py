from rest_framework import serializers

from api.base.serializers import DocumentSerializer

from api.schools.models import Student
from api.subjects.models import SubjectNode

from ..attempts.models import AttemptType

def RelatedAssessmentsField():
    return serializers.ListField(child=serializers.PrimaryKeyRelatedField(read_only=True))


class ProgressSerializer(DocumentSerializer):
    @staticmethod
    def for_attempt_type(attempt_type, *args, **kwargs):
        cls = {
            AttemptType.PASS_FAIL: PassFailProgressSerializer,
            AttemptType.COMPLETION_BASED: CompletionBasedProgressSerializer,
            AttemptType.GRADED: GradedProgressSerializer,
            AttemptType.RATED: RatedProgressSerializer
        }[attempt_type]
        return cls(*args, **kwargs)
        
    assessment_type = serializers.CharField()

    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    subject_node = serializers.PrimaryKeyRelatedField(queryset=SubjectNode.objects.all(), allow_null=True)

    school = serializers.PrimaryKeyRelatedField(source='assessment_schema.school', read_only=True)
    subject = serializers.PrimaryKeyRelatedField(source='assessment_schema.subject', read_only=True)

    assessment_count = serializers.IntegerField()

    attempted_assessments = RelatedAssessmentsField()
    attempted_assessment_count = serializers.IntegerField()

    percent_attempted = serializers.FloatField()

    def to_representation(self, instance):
        from api.assessments.serializers import AssessmentSerializer

        representation = super().to_representation(instance)

        assessment_serializer = AssessmentSerializer.for_assessment_type(
            instance.assessment_type,
            instance.assessments.all(),
            many=True
        )

        representation.update(assessments=assessment_serializer.data)
        return representation


class PassFailProgressSerializer(ProgressSerializer):
    passed_assessments          = RelatedAssessmentsField()
    passed_assessment_count     = serializers.IntegerField()

    percent_passed              = serializers.FloatField()


class CompletionBasedProgressSerializer(ProgressSerializer):
    partially_complete_assessments = RelatedAssessmentsField()
    partially_complete_assessment_count = serializers.IntegerField()

    complete_assessments = RelatedAssessmentsField()
    complete_assessment_count = serializers.IntegerField()

    percent_partially_complete = serializers.FloatField()    
    percent_complete = serializers.FloatField()


class GradedProgressSerializer(ProgressSerializer):
    class GradeSerializer(serializers.Serializer):
        assessments = RelatedAssessmentsField()
        assessment_count = serializers.IntegerField()

    grade_assessments = serializers.DictField(
        child=GradeSerializer()
    )

class RatedProgressSerializer(ProgressSerializer):
    assessment_ratings = serializers.DictField(
        child=serializers.IntegerField()
    )

