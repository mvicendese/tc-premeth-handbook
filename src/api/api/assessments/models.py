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

    # Sets a fixed maximum available rating for all rated attempts
    _attempt_type_RATED_max_available_rating = models.PositiveIntegerField(null=True)

    @property
    def attempt_set(self):
        return (
            Attempt.objects_of_type(self.attempt_type)
        )

    @property
    def report_set(self):
        return (
            Report.objects_of_type(self.attempt_type)
            .filter(assessment_schema=self)
        )

    @property
    def progress_set(self):
        return (
            Progress.objects_of_type(self.attempt_type)
            .filter(assessment_schema=self)
        )

    def set_attempt_argument(self, param_name, value):
        attempt_type = AttemptType(self.attempt_type)
        attempt_option_name = f'_attempt_type_{attempt_type.name}_{param_name}'
        if hasattr(self, attempt_option_name):
            setattr(self, attempt_option_name, value)
        raise KeyError(f'{self.attempt_type} attempt has no {attempt_option_name} parameter')


    def get_attempt_argument(self, param_name):
        attempt_type = AttemptType(self.attempt_type)
        attempt_option_name = f'_attempt_type_{attempt_type.name}_{param_name}'
        if hasattr(self, attempt_option_name):
            return getattr(self, attempt_option_name)
        raise KeyError(f'{self.attempt_type} attempt has no {attempt_option_name} parameter')


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

        return report

    def annotate_assessments(self, assessment_set):
        attempts = Attempt.objects_of_type(self.attempt_type)
        return attempts.annotate_assessments(assessment_set)



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

    schema          = models.ForeignKey(AssessmentSchema, on_delete=models.CASCADE)

    # The student that is taking the assessment.
    # The student must:
    #   - belong to the same school as the schema
    #   - be related to the assessment schema by a SubjectClass
    student         = models.ForeignKey(Student, on_delete=models.CASCADE)

    # The node that the assessment is being run for.
    # The node must:
    #   - be a descendant of the subject of the assessment schema
    #   - be of the same type as the schema's 'subject_node_type'
    subject_node    = models.ForeignKey(SubjectNode, on_delete=models.CASCADE)


    # Attempt creation parameters
    # FIXME: Move to a database that supports unstructured data better
    _attempt_type_RATED_max_available_rating = models.PositiveSmallIntegerField(null=True)

    @property
    def attempt_set(self):
        return self.schema.attempt_set.filter(assessment=self)

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

    objects = Manager.from_queryset(QuerySet)(None)

    unit_assessments = Manager.from_queryset(QuerySet)('unit-assessment')
    block_assessments = Manager.from_queryset(QuerySet)('block-assessment')
    lesson_prelearning_assessments = Manager.from_queryset(QuerySet)('lesson-prelearning-assessment')
    lesson_outcome_self_assessments = Manager.from_queryset(QuerySet)('lesson-outcome-self-assessment')

    @classmethod
    def objects_of_type(cls, assessment_type):
        if assessment_type is None:
            return cls.objects
        elif assessment_type == 'unit-assessment':
            return cls.unit_assessments
        elif assessment_type == 'block-assessment':
            return cls.block_assessments 
        elif assessment_type == 'lesson-prelearning-assessment':
            return cls.lesson_prelearning_assessments
        elif assessment_type == 'lesson-outcome-self-assessment':
            return cls.lesson_outcome_self_assessments
        else:
            raise ValueError(f'Invalid assessment type {assessment_type}')


    def set_attempt_argument(self, name, value):
        attempt_type = AttemptType(self.attempt_type)
        attempt_option_name = f'_attempt_type_{attempt_type.name}_{name}'
        if hasattr(self, attempt_option_name):
            setattr(self, attempt_option_name, value)
        raise KeyError(f'{self.attempt_type} attempt has no {attempt_option_name} parameter')

    def get_attempt_argument(self, parameter_name):
        arg_value = self.schema.get_attempt_argument(parameter_name)

        if arg_value is not None:
            return arg_value

        attempt_type = AttemptType(self.attempt_type)
        attempt_option_name = f'_attempt_type_{attempt_type.name}_{name}'

        if hasattr(self, attempt_option_name):
            return getattr(self, attempt_option_name)
        raise KeyError(f'{self.attempt_type} attempt has no {attempt_option_name} parameter')
