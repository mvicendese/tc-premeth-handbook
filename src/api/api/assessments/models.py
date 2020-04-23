import re

from enum import Enum
from uuid import uuid4, UUID

from django.core import validators
from django.core.exceptions import MultipleObjectsReturned
from django.db import models

from django.utils.translation import gettext_lazy as _

from api.base.models import BaseModel, Document

from api.schools.models import School, Student, SubjectClass
from api.subjects.models import (
    SubjectNode, 
    SubjectNodeType, 
    SubjectNodeTypeField,
    Subject, 
    Lesson, 
    Block, 
    Unit, 
    LessonOutcome
)

from .attempts.models import *
from .progresses.models import *
from .reports.models import *


###################################
##
## Assessment Schema definitions
##
###################################


class AssessmentSchema(BaseModel):
    """
    An assessment schema represents the template from which new assessments are produced.

    There is only one assessment schema, but there is an assessment for each node of the 
    given node type
    """

    type = models.CharField(max_length=64, unique=True)

    school = models.ForeignKey(School, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)

    # Assessments generated from this schema apply to this node type.
    subject_node_type = SubjectNodeTypeField()

    ##
    ## Attempt creation arguments
    ## FIXME: Migrate to a database that does unstructured data better 
    ##
    attempt_type = AttemptTypeField()

    @property
    def attempt_set(self):
        return (
            Attempt.objects_of_type(self.attempt_type)
        )

    @property
    def report_set(self):
        return (Report
            .objects_of_type(self.attempt_type)
            .filter(assessment_schema=self))

    @property
    def progress_set(self):
        return (Progress
            .objects_of_type(self.attempt_type)
            .filter(assessment_schema=self))

    @property
    def assessment_set(self):
        return Assessment.objects_of_type(self.type)

    def get_assessment_option_default(self, param_name):
        AssessmentOptions.objects.get_option_default(self, param_name)

    def set_assessment_option_default(self, param_name, value):
        AssessmentOptions.objects.set_option_default(self, param_name, value)


    def get_assessment_option(self, subject_node, param_name):
        AssessmentOptions.objects.get_option(self, subject_node, param_name)

    def get_assessment_option(self, subject_node, param_name, value):
        if subject_node.node_type != self.subject_node_type:
            raise ValueError(f'Can only set assessment options on {self} for {self.subject_node_type} subject nodes')
        AssessmentOptions.objects.set_option(self, subject_node, param_name, value)


    def get_or_generate_progress(self, student, subject_node=None):

        progress, is_newly_created = self.progress_set.get_or_create(
            assessment_schema=self,
            student=student,
            subject_node=subject_node
        )

        if is_newly_created or progress.requires_regeneration:
            progress.generate()
            progress.save()

        return progress

    def get_or_generate_report(self, subject_class=None, subject_node=None):
        if subject_node.node_type != self.subject_node_type:
            raise ValueError(f'subject_node must be of type {self.assessment_schema.subject_node_type}')

        report, is_newly_created = self.report_set.get_or_create(
            assessment_schema=self,
            subject_class=subject_class,
            subject_node=subject_node
        )

        if is_newly_created or report.requires_regeneration:
            report.generate()
            report.save()

        return report

    def annotate_assessments(self, assessment_set):
        attempts = Attempt.objects_of_type(self.attempt_type)
        return attempts.annotate_assessments(assessment_set)

class AssessmentOptions(BaseModel):
    """
    Represents a parameterisation of an assessment for a given subject node.

    Options for the assessment that are 
        - common to all students
        - vary by subject node
    """

    schema = models.ForeignKey(AssessmentSchema, related_name='+', on_delete=models.CASCADE)

    # The subject node to attach the options to
    #
    # The node must:
    #   - Be a descendant of the subject of the assessment schema
    #   - be of the same type as the schema's 'subject_node_type'
    # 
    # A `null` subject node is used to provide parameters that are common to all subjects
    subject_node = models.ForeignKey(SubjectNode, related_name='+', on_delete=models.CASCADE, null=True)

    _RATED_max_available_rating = models.PositiveSmallIntegerField(null=True)

    class Meta:
        indexes = [
            models.Index(fields=['schema_id', 'subject_node_id'], name='index_schema_node')
        ]

        constraints = [
            models.UniqueConstraint(fields=['schema_id', 'subject_node_id'], name='unique_schema_node'),
            models.UniqueConstraint(fields=['schema_id'], condition=models.Q(subject_node_id=None), name='unique_schema_default')
        ]

    def _option_name(self, name):
        # For now, everything that would use an assessment option is parameterised by the attempt type.
        # We need a database capable of unstructured data.
        attempt = AttemptType(self.schema.attempt_type)
        return f'_{attempt_type.name}_{name}'

    def get_option(self, name):
        option_name = self._option_name(name)

        if hasattr(self, name):
            return getattr(self, name)

        try:
            attempt_option_defaults = AssessmentOptions.get(schema=self.schema, subject_node=None)
            return attempt_options.get_option(name)
        except AssessmentOptions.DoesNotExist:
            pass

        raise KeyError(f'{self.attempt_type} attempt has no {name} parameter')

    def set_option(self, name, value):
        setattr(self, self._option_name(name), value)


    class Manager(models.Manager):
        def get_option_default(self, assessment_schema, name):
            return self.get_option(self, assessment_schema, None, name)

        def set_option_default(self, assessment_schema, param_name, value):
            return self.set_option(assessment_schema, None, name, value)

        def get_option(self, assessment_schema, subject_node, param_name, value):
            attempt_options = self.get_or_create(
                schema=assessment_schema, 
                subject_node=subject_node
            )
            return attempt_otpions.get_option(name)
            
        def set_option(self, assessment_schema, subject_node, param_name, value):
            attempt_options = self.get_or_create(
                schema=assessment_schema,
                subject_node=subject_node
            )
            attempt_options.set_option(name, value)
            attempt_options.save()
            return attempt_options

        objects = models.Manager()


####################################
##
## Assessment model
##
####################################

class Assessment(BaseModel):
    """
    An assessment represents an input describing a student's progress through
    the course.

    """

    schema          = models.ForeignKey(AssessmentSchema, related_name='+', on_delete=models.CASCADE)

    # The student that is taking the assessment.
    # The student must:
    #   - belong to the same school as the schema
    #   - be related to the assessment schema by a SubjectClass
    student         = models.ForeignKey(Student, related_name='+', on_delete=models.CASCADE)

    # The node that the assessment is being run for.
    # The node must:
    #   - be a descendant of the subject of the assessment schema
    #   - be of the same type as the schema's 'subject_node_type'
    subject_node    = models.ForeignKey(SubjectNode, related_name='+', on_delete=models.CASCADE)


    class Meta:
        indexes = [
            models.Index(
                fields=['schema_id', 'student_id'],
                name='index_ass_schema_student'
            ),
            models.Index(
                fields=['schema_id', 'subject_node_id'],
                name='index_ass_schema_node'
            ),
            models.Index(
                fields=['schema_id', 'subject_node_id', 'student_id'],
                name='index_ass_schema_student_node'
            )

        ]

        constraints = [
            models.UniqueConstraint(
                fields=['schema_id', 'student_id', 'subject_node_id'],
                name='unique_assessment'
            )
        ]

    @property
    def options(self):
        if not hasattr(self, '_options'):
            self._options = AssessmentOptions.get(schema=self.schema, subject_node=self.subject_node)
        return self._options

    @property
    def attempt_set(self):
        if not hasattr(self, '_attempt_set'):
            self._attempt_set = self.schema.attempt_set.with_options(self.options).filter(assessment=self)
        return self._attempt_set

    class QuerySet(models.QuerySet):
        def filter_node(self, subject_node, include_descendants=False):
            qs = self.filter(subject_node=subject_node)
            if include_descendants:
                qs = qs.union(self.filter(subject_node__in=subject_node.get_descendants()))
            return self.filter(pk__in=qs.values('id'))

        def filter_class(self, subject_class):
            return self.filter(student__in=subject_class.students.all())

        def filter_students(self, students):
            return self.filter(student__in=students)

        def filter_type(self, assessment_type):
            qs = self.annotate(type=models.F('schema__type'))

            if assessment_type is not None:
                qs = qs.filter(type=assessment_type)
                schema = AssessmentSchema.objects.get(type=assessment_type)
                qs = schema.annotate_assessments(qs)
            return qs

    class Manager(models.Manager):
        def __init__(self, assessment_type):
            super().__init__()
            self.assessment_type = assessment_type

        @property
        def schema(self):
            return self.assessment_type and AssessmentSchema.objects.get(type=self.assessment_type)

        def get_queryset(self):
            return (super().get_queryset()
                .filter_type(self.assessment_type))

    unit_assessments = Manager.from_queryset(QuerySet)('unit-assessment')
    block_assessments = Manager.from_queryset(QuerySet)('block-assessment')
    lesson_prelearning_assessments = Manager.from_queryset(QuerySet)('lesson-prelearning-assessment')
    lesson_outcome_self_assessments = Manager.from_queryset(QuerySet)('lesson-outcome-self-assessment')

    @classmethod
    def objects_of_type(cls, assessment_type):
        if assessment_type == 'unit-assessment':
            return cls.unit_assessments
        elif assessment_type == 'block-assessment':
            return cls.block_assessments 
        elif assessment_type == 'lesson-prelearning-assessment':
            return cls.lesson_prelearning_assessments
        elif assessment_type == 'lesson-outcome-self-assessment':
            return cls.lesson_outcome_self_assessments
        else:
            raise ValueError(f'Invalid assessment type {assessment_type}')

