from uuid import uuid4

from django.core.exceptions import ValidationError
from rest_framework import serializers

from api.base.models import Comment
from api.base.serializers import BaseSerializer
from api.base.serializers import CommentSerializer

from api.subjects.models import SubjectNode

from api.schools.models import Student
from api.schools.serializers import StudentSerializer

from .models import (
    Assessment, 
    AssessmentSchema
)


from .attempts.serializers import *
from .progresses.serializers import *
from .reports.serializers import *


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
    def for_assessment_type(assessment_type, *args, **kwargs):
        if assessment_type is None:
            return AssessmentSerializer

        if assessment_type == 'unit-assessment':
            return UnitAssessmentSerializer(*args, **kwargs)
        elif assessment_type == 'block-assessment':
            return BlockAssessmentSerializer(*args, **kwargs)
        elif assessment_type == 'lesson-prelearning-assessment':
            return LessonPrelearningAssessmentSerializer(*args, **kwargs)
        elif assessment_type == 'lesson-outcome-self-assessment':
            return LessonOutcomeSelfAssessmentSerializer(*args, **kwargs)
        else:
            raise ValueError(f'Unrecognised assessment type {assessment_type}')

    type = serializers.CharField()
    id = serializers.UUIDField()

    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    subject_node    = serializers.PrimaryKeyRelatedField(queryset=SubjectNode.objects.all())

    school          = serializers.PrimaryKeyRelatedField(source='schema.school', read_only=True)
    subject         = serializers.PrimaryKeyRelatedField(source='schema.subject.id', read_only=True)

    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(allow_null=True, read_only=True)

    is_attempted = serializers.BooleanField()
    attempted_at = serializers.DateTimeField(allow_null=True)

    comments = serializers.ListSerializer(child=CommentSerializer())


    def schema_serializer(self, instance):
        serializer_cls = schema_serializer_class_for_type(instance.type)
        return serializer_cls(instance.schema)

    def validate(self, data):
        # There must be a schema that exists for the assessment
        try:
            data['schema'] = AssessmentSchema.objects.filter(
                type=data['type'],
                school=data['student'].school,
            ).get()
        except AssessmentSchema.DoesNotExist:
            raise ValidationError(
                f'Cannot create {type} assessment for student. '
                f'There is no assessment schema of the given type for students at {school.name}.'
            )
        return data

    def create(self, validated_data):
        a = Assessment.objects_of_type(validated_data['type']).create(
            schema= validated_data.get('schema'),
            student=validated_data.get('student'),
            subject_node=validated_data.get('subject_node')
        )
        # Reload to add annotations
        a = Assessment.objects_of_type(validated_data["type"]).get(pk=a.pk)
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

    max_available_rating = serializers.IntegerField()
    rating          = serializers.IntegerField()
    #percent_rating  = serializers.FloatField()

    attempts = RatedAttemptSerializer(many=True, read_only=True, source='attempt_set')

class UnitAssessmentSerializer(RatingsBasedAssessmentSerializer):
    unit = serializers.UUIDField(source='schema.unit.id', read_only=True)

class BlockAssessmentSerializer(RatingsBasedAssessmentSerializer):
    block = serializers.UUIDField(source='schema.block.id', read_only=True)

class LessonPrelearningAssessmentSerializer(CompletionBasedAssessmentSerializer):
    lesson = serializers.UUIDField(source='schema.lesson.id', read_only=True)

class LessonOutcomeSelfAssessmentSerializer(RatingsBasedAssessmentSerializer):
    lesson_outcome = serializers.UUIDField(source='schema.lessonoutcome.id', read_only=True)


