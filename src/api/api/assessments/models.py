from enum import Enum
from uuid import uuid4, UUID

from django.core import validators
from django.core.exceptions import MultipleObjectsReturned
from django.db import models

from django.utils.translation import gettext_lazy as _

from api.base.models import BaseModel, Document

from api.schools.models import School, Student, SubjectClass
from api.subjects.models import SubjectNode, Subject, Lesson, Block, Unit, LessonOutcome


##########################################
## 
##  Attempt
##
##########################################

class Attempt(BaseModel):
    assessment = models.ForeignKey('assessments.Assessment', on_delete=models.CASCADE)

    attempt_number = models.PositiveSmallIntegerField()
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
        ordering = ('assessment_id', 'attempt_number')

    class AttemptSet(models.QuerySet):
        def max_attempt_number(self):
            return self.aggregate(models.Max('attempt_number'))['attempt_number__max']

        def create(self, *, assessment=None, **kwargs):
            kwargs.pop('attempt_number', None)
            return super().create(
                assessment=assessment,
                attempt_number=self.max_attempt_number() + 1,
                **kwargs
            )

    class AttemptManager(models.Manager):
        def get_queryset(self):
            return Attempt.AttemptSet(self.model, using=self._db).annotate(
                schema=models.F('assessment__schema_base')
            )

    objects = AttemptManager()

class CompletionState(models.TextChoices):
    NONE        = 'no',         _('Not complete')
    PARTIAL     = 'partial',    _('Partially complete')
    COMPLETE    = 'complete',   _('Complete')


class CompletionAttempt(Attempt):
    completion_state = models.CharField(
        max_length=8,
        default=CompletionState.NONE
    )

    @property
    def is_complete(self):
        return self.completion_state == CompletionState.COMPLETE

    @property
    def is_partially_complete(self):
        return self.completion_state == CompletionState.PARTIAL


class RatedAttempt(Attempt):
    rating = models.PositiveSmallIntegerField()

    @property
    def maximum_available_rating(self):
        return self.assessment.schema.maximum_available_rating

    def rating_percent(self):
        return 100 * (self.rating / self.maximum_available_rating)



###############################
## 
## Assessment Reports
##
###############################

class Report(BaseModel):
    """
    A report represents a snapshot in time of students that have attempted the assessment.

    If a student has multiple attempts at an assessment, only the most recent attempt is used
    when generating the report.
    """

    class Meta: 
        abstract = True

    @staticmethod
    def objects_for_type(assessment_type):
        schema_cls = _schema_cls_for_type(assessment_type)
        return schema_cls.report_cls.objects

    generation = models.PositiveIntegerField(default=0)

    assessment_schema = models.ForeignKey('assessments.AssessmentSchema', on_delete=models.CASCADE)

    ## The subject class this was developed for
    subject_class = models.ForeignKey(SubjectClass, null=True, on_delete=models.CASCADE)

    # TODO: when moving to a more capbale database, these should be ArrayFields
    _candidate_ids = models.TextField(default='')
    _attempted_candidate_ids = models.TextField(default='')

    @property
    def type(self):
        return self.assessment_schema.type + '-report'

    @property
    def assessment_type(self):
        return self.assessment_schema.type

    @property
    def generated_at(self):
        return self.updated_at

    @property
    def requires_regeneration(self):
        return True # TODO: Watch for when an assessment has changed.

    @property
    def candidate_ids(self):
        return (
            set(UUID(hex=id) for id in self._candidate_ids.split(':'))
            if self._candidate_ids else set()
        )

    @property
    def candidate_count(self):
        return len(self.candidate_ids)

    @candidate_ids.setter
    def candidate_ids(self, ids):
        self._candidate_ids = ':'.join(id.hex for id in ids)

    @property
    def attempted_candidate_ids(self):
        return (
            set(UUID(hex=id) for id in self._attempted_candidate_ids.split(':'))
            if self._attempted_candidate_ids else set()
        )

    @attempted_candidate_ids.setter
    def attempted_candidate_ids(self, ids):
        self._attempted_candidate_ids = ':'.join(id.hex for id in ids)

    @property
    def attempted_candidate_count(self):
        return len(self.attempted_candidate_ids)

    @property
    def percent_attempted(self):
        if self.candidate_count == 0:
            return math.nan
        return 100 * (self.attempted_candidate_count / self.candidate_count)

    @property
    def assessment_set(self):
        assessments = (
            Assessment
               .objects_of_type(self.assessment_schema.type)
               .filter(schema_base=self.assessment_schema)
        )
        if self.subject_class is not None:
            assessments = assessments.filter_class(self.subject_class)
        return assessments.all()

    def _snapshot_candidate_set(self):
        """
        Take a snapshot of the candidates associated with the assessment at the moment.
        May not be the same as the candidates when the report was generated
        """
        candidates = self.assessment_schema.candidate_set
        if self.subject_class is not None:
            candidates = candidates.filter(subjectclass=self.subject_class)
        return candidates

    def should_regenerate(self):
        return True

    def generate(self):
        if self.id is None:
            self.id = uuid4()

        self.generation += 1
        candidate_set = self._snapshot_candidate_set()

        self.candidate_ids = set(student.id for student in candidate_set)

        attempted_set = self.assessment_set.filter(is_attempted=True)
        self.attempted_candidate_ids = set(assessment.student_id for assessment in self.assessment_set)
        return self

    class QuerySet(models.QuerySet):

        def filter_node(self, node):
            return self.filter(assessment_schema__in=AssessmentSchema.objects.filter_node(node))

    objects = models.Manager.from_queryset(QuerySet)


class RatingBasedReport(Report):

    rating_average = models.FloatField(null=True)
    rating_std_dev = models.FloatField(null=True)

    _attempted_candidate_scores = models.TextField(null=True)

    maximum_acheived_rating = models.FloatField(null=True)
    minimum_achieved_rating = models.FloatField(null=True)

    maximum_achieved_rating_by = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='+', null=True)
    minimum_achieved_rating_by = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='+', null=True)

    @property
    def passed_candidate_ids(self):
        return (
            set(UUID(hex=id) for id in self._passed_candidate_ids.split(':'))
            if self._passed_candidate_ids else set()
        )

    @passed_candidate_ids.setter
    def passed_candidate_ids(self, value):
        self._passed_candidate_ids = ':'.join(id.hex for id in value)

    @property
    def failed_candidate_ids(self):
        return self.attempted_candidate_ids - self.passed_candidate_ids

    @property
    def attempted_candidate_scores(self):
        scores = map(
            lambda score: score.split(':'),
            self._attempted_candidate_scores.split(',')
        ) if self._attempted_candidate_scores else [] 

        result = []
        for k, v in scores:
            result.append([str(k), int(v)])
        return dict(result)

    @attempted_candidate_scores.setter
    def attempted_candidate_scores(self, value):
        result = []
        for k, v in value.items():
            result.append(f'{k}:{v}')
        self._attempted_candidate_scores = ','.join(result)


    def generate(self):
        super().generate()
        attempts = self.assessment_set.filter(is_attempted=True)
        attempt_aggregates = attempts.aggregate(
            rating_average=models.Avg('rating'),
            rating_std_dev=models.StdDev('rating')
        )
        self.rating_average = attempt_aggregates['rating_average'] 
        self.rating_std_dev = attempt_aggregates['rating_std_dev']

        scores = {}
        for attempt in attempts.all():
            scores[str(attempt.student_id)] = attempt.rating
        self.attempted_candidate_scores = scores

        return self


class CompletionBasedReport(Report):
    completed_candidate_count = models.IntegerField(null=True)
    _completed_candidate_ids = models.TextField(default='')

    partially_completed_candidate_count = models.IntegerField(null=True)
    _partially_completed_candidate_ids = models.TextField(default='')

    @property
    def completed_candidate_ids(self):
        return (
            set(UUID(hex=id) for id in self._completed_candidate_ids.split(':'))
            if self._completed_candidate_ids else []
        )

    @completed_candidate_ids.setter
    def completed_candidate_ids(self, value):
        self._completed_candidate_ids = ':'.join(id.hex for id in value)

    @property
    def partially_completed_candidate_ids(self):
        return (
            set(UUID(hex=id) for id in self._partially_completed_caniddate_ids.split(':'))
            if self._partially_completed_candidate_ids else []
        )

    @partially_completed_candidate_ids.setter
    def partially_completed_candidate_ids(self, value): 
        self._partially_completed_candidate_ids = ':'.join(id.hex for id in value)

    @property
    def percent_completed(self):
        return (100 * self.completed_candidate_count) / self.candidate_count

    @property
    def percent_partial_completed(self):
        return (100 * self.partially_completed_candidate_count) / self.candidate_count

    def generate(self):
        super().generate()

        completed_assessments = self.assessment_set.filter(completion_state=CompletionState.COMPLETE)
        self.completed_candidate_count = completed_assessments.count()
        self.completed_candidate_ids = [assessment.student_id for assessment in completed_assessments]

        partial_complete_assessments = self.assessment_set.filter(completion_state=CompletionState.PARTIAL)
        self.partially_completed_candidate_count = partial_complete_assessments.count()
        self.partially_completed_candidate_ids = [assessment.student_id for assessment in partial_complete_assessments]

        return self


###################################
##
## Assessment progress
## 
###################################

class Progress(Document):
    """
    A Progress represents a snapshot of all the assessments a particular
    student has completed while progressing through the specified 
    subject node
    """
    class Meta:
        abstract = True

    @staticmethod
    def objects_for_type(assessment_type):
        schema_cls = _schema_cls_for_type(assessment_type)
        return schema_cls.progress_cls.objects


    # Recording the results of the given student
    student = models.ForeignKey(Student, on_delete=models.CASCADE)

    # Limited to results nested under the given node
    node = models.ForeignKey(SubjectNode, on_delete=models.CASCADE)

    # Details of the last time this progress was generated
    generation = models.PositiveIntegerField(default=0)

    # The assessment ids which were included in this generation
    _assessment_ids = models.TextField()

    # The assessments for which the student made an attempt
    _attempted_assessment_ids = models.TextField()

    @property
    def generated_at(self):
        return self.updated_at

    @property
    def requires_regeneration(self):
        return True # Watch for when an assessment has changed

    @property
    def assessment_ids(self):
        return (
            set(UUID(hex=id) for id in self._assessment_ids.split(':'))
            if self._assessment_ids else set()
        )

    @property
    def assessment_count(self):
        return len(self.assessment_ids)

    @assessment_ids.setter
    def assessment_ids(self, ids):
        self._assessment_ids = ':'.join()

    @property
    def attempted_assessment_ids(self):
        return (
            set(UUID(hex=id) for id in self._attempted_assessment_ids.split(':'))
            if self._attempted_assessment_ids else set()
        )

    @property
    def attempted_assessment_count(self):
        return len(self.attempted_assessment_ids)

    def _snapshot_assessment_set(self):
        assessments = (
            Assessment
                .objects_of_type(self.assessment_schema.type)
                .filter(student=self.student)
        )


    def generate(self):
        self.generation += 1
        assessment_set = self._snapshot_assessment_set()
        self.assessment_ids = set(a.id for a in assessment_set)

        attempted_set = assessment_set.filter(is_attempted=True)
        self.attempted_assessment_ids = set(a.id for a in attempted_set)

        return self


    @staticmethod
    def objects_of_type(self, assessment_type):
        schema_cls = _schema_cls_for_type(assessment_type)
        return schema_cls.progress_cls.objects


class RatingBasedProgress(Progress):
    def generate(self):
        return super().generate()

class CompletionBasedProgress(Progress):
    _complete_assessment_ids = models.TextField() 
    _partially_complete_assessment_ids = models.TextField()

    @property
    def complete_assessment_ids(self):
        return (
            set(UUID(hex=id) for id in self._completed_assessment_ids.split(':'))
            if self._completed_assessment_ids else set()
        )

    @complete_assessment_ids.setter
    def complete_assessment_ids(self, ids):
        self._complete_assessment_ids = ':'.join(id.hex for id in ids)

    @property
    def complete_assessment_count(self):
        return len(self.complete_assessment_ids)


    @property
    def partially_complete_assessment_ids(self):
        return (
            set(UUID(hex=id) for id in self._partially_completed_assessment_ids.split(':'))
            if self._partially_completed_assessment_ids else set()
        )

    @partially_complete_assessment_ids.setter
    def partiall_complete_assessment_ids(self, ids):
        self._partially_complete_assessment_ids = ':'.join(id.hex for id in ids)

    @property
    def partially_complete_assessment_count(self):
        return len(self.partially_complete_assessment_ids)

    @property
    def percent_complete(self):
        return (100 * self.complete_candidate_count) / self.candidate_count

    def generate(self):
        super().generate()

        assessment_set = self._snapshot_assessment_set()

        complete_assessments = assessment_set.filter(completion_state=CompletionState.COMPLETE)
        self.complete_assessment_ids = set(a.id for id in complete_assessments.all())

        partially_complete_assessments = assessment_set.filter(completion_state=CompletionState.COMPLETE)
        self.partially_complete_assessment_ids = set(a.id for a in partially_complete_assessments)

        return self


###################################
##
## Assessment Schema definitions
##
###################################

class AssessmentType(models.TextChoices):
    UNIT                = 'unit-assessment', _('Unit assessment')
    BLOCK               = 'block-assessment', _('Block assessment')
    LESSON_PRELEARNING  = 'lesson-prelearning-assessment', _('Lesson prelearning')
    LESSON_OUTCOME_SELF = 'lesson-outcome-self-assessment', _('Lesson outcome self-assessment')


class AssessmentSchema(BaseModel):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    node = models.ForeignKey(SubjectNode, on_delete=models.CASCADE, null=True)
    type = models.CharField(max_length=64)

    @property
    def subject(self):
        return self.node.subject()

    @property
    def candidate_set(self):
        return Student.objects.filter(school=self.school)

    @property
    def report_set(self):
        report_cls = _schema_cls_for_type(self.type).report_cls
        return report_cls.objects

    @property
    def progress_set(self, student):
        progress_cls = _schema_cls_for_type(self.type).progress_cls
        return progress_cls.objects_for_student(student)

    def get_or_generate_report(self, subject_class=None):
        try:
            report, is_newly_created = self.report_set.get_or_create(
                assessment_schema=self, 
                subject_class=subject_class,
                defaults={'id': uuid4}
            )
        except MultipleObjectsReturned as err:
            ## TODO: Remove this
            print(f'Multiple objects returned for {self.id}')
            print(f'{self.report_set.get_queryset().delete()} rows deleted')
            return self.get_or_generate_report(subject_class)

        if is_newly_created or report.requires_regeneration:
            report.generate()
            report.save()

        return report

    def get_or_generate_prgress(self, student, subject_node=None):
        progress, is_newly_created = self.progress_set


    class QuerySet(models.QuerySet):

        def filter_node(self, node, include_descendents=False):
            qs = self.filter(node=node)
            if include_descendents:
                qs = qs.union(self.filter(node__in=node.get_descendants().values('id')))
            return qs

    objects = models.Manager.from_queryset(QuerySet)()

    @staticmethod
    def objects_of_type(assessment_type):
        return _schema_cls_for_type(assessment_type).objects

    def assessment__type(self, assessment):
        return self.type

class CompletionBasedAssessmentSchema(AssessmentSchema):
    class Meta:
        abstract = True

    marking_type = 'completion-based'

    attempt_cls  = CompletionAttempt
    allow_partial_completion = False

    report_cls   = CompletionBasedReport
    progress_cls = CompletionBasedProgress

    @classmethod
    def annotate_assessments(cls, assessment_set):
        most_recent_attempts = (
            CompletionAttempt.objects
            .filter(assessment_id=models.OuterRef('id')).order_by('-attempt_number')
        )

        return assessment_set.annotate(
            is_attempted=models.Exists(most_recent_attempts),
            last_attempt_id=models.Subquery(most_recent_attempts.values('id')[:1]),
            attempted_at=models.Subquery(most_recent_attempts.values('date')[:1]),

            completion_state=models.Subquery(
                most_recent_attempts.values('completion_state')[:1]
            ),
        )

    def assessment__is_complete(self, assessment):
        return assessment.completion_state == CompletionState.COMPLETE

    def assessment__is_partially_complete(self, assessment):
        return assessment.completion_state == CompletionState.PARTIAL


class RatingsBasedAssessmentSchema(AssessmentSchema):
    class Meta:
        abstract = True

    marking_type    = 'ratings-based'
    attempt_cls     = RatedAttempt
    report_cls      = RatingBasedReport
    progress_cls    = CompletionBasedProgress

    maximum_available_rating = models.PositiveSmallIntegerField(validators=[validators.MinValueValidator(1)])
    minimum_pass_mark = models.PositiveSmallIntegerField(null=True)

    @classmethod
    def annotate_assessments(cls, assessment_set):
        most_recent_attempts = (
            RatedAttempt.objects
            .filter(assessment_id=models.OuterRef('id'))
            .order_by('-attempt_number')
        )    
        leaf_schema_rel_name = f'schema_base__{cls.__name__.lower()}'

        return assessment_set.annotate(
            maximum_available_rating=models.F(f'{leaf_schema_rel_name}__maximum_available_rating'),
            is_attempted=models.Exists(most_recent_attempts),
            attempted_at=models.Subquery(most_recent_attempts.values('date')[:1]),
            rating=models.Subquery(most_recent_attempts.values('rating')[:1]),

            rating_percent=(models.F('rating') * 100) / models.F('maximum_available_rating')
        )


####################################
##
## Leaf assessment types
##
####################################

class UnitAssessmentSchema(RatingsBasedAssessmentSchema):
    assessment_type     = 'unit-assessment'

    @property
    def unit(self):
        return self.node.unit()

class BlockAssessmentSchema(RatingsBasedAssessmentSchema):
    assessment_type = 'block-assessment'

    @property
    def block(self):
        return self.node.block()

class LessonPrelearningAssessmentSchema(CompletionBasedAssessmentSchema):
    assessment_type     = 'lesson-prelearning-assessment'
    allow_partial_completion = True

    @property
    def lesson(self):
        return self.node.lesson()

    
class LessonOutcomeSelfAssessmentSchema(RatingsBasedAssessmentSchema):
    assessment_type = 'lesson-outcome-self-assessment'
    maximum_available_rating = models.PositiveSmallIntegerField(default=5)

    @property
    def lessonoutcome(self):
        return self.node.lessonoutcome()

def _schema_cls_for_type(assessment_type):
    if assessment_type == 'unit-assessment':
        return UnitAssessmentSchema
    elif assessment_type == 'block-assessment':
        return BlockAssessmentSchema
    elif assessment_type == 'lesson-prelearning-assessment':
        return LessonPrelearningAssessmentSchema
    elif assessment_type == 'lesson-outcome-self-assessment':
        return LessonOutcomeSelfAssessmentSchema
    else:
        raise Exception(f'No schema class for assessment type {assessment_type}')


####################################
##
## Assessment model
##
####################################

class Assessment(BaseModel):
    student     = models.ForeignKey(Student, on_delete=models.CASCADE)
    schema_base = models.ForeignKey(AssessmentSchema, on_delete=models.CASCADE)

    @property
    def attempt_set(self):
        schema_cls = _schema_cls_for_type(self.type)
        attempt_cls = schema_cls.attempt_cls
        return attempt_cls.objects.filter(assessment=self)

    @property
    def schema(self):
        if hasattr(self, 'schema_base'):
            schema_cls = _schema_cls_for_type(self.schema_base.type)
        return getattr(self.schema_base, schema_cls.__name__.lower())

    @property
    def node(self):
        return self.schema_base.node

    class QuerySet(models.QuerySet):
        
        def filter_node(self, subject_node, include_descendents=False):
            schemas = AssessmentSchema.objects.filter_node(subject_node, include_descendents)
            return self.filter(schema_base__in=schemas.values('id'))

        def filter_class(self, subject_class):
            return self.filter(student__in=subject_class.students.all())

        def filter_students(self, students):
            return self.filter(student__in=students)

        def filter_type(self, assessment_type):
            qs = self.filter(type=assessment_type)

            schema_cls = _schema_cls_for_type(assessment_type)
            qs = qs.select_related(f'schema_base__{schema_cls.__name__.lower()}')

            related_attempts_name = schema_cls.attempt_cls.__name__.lower() + '_set'
            qs = qs.prefetch_related(related_attempts_name)

            qs = schema_cls.annotate_assessments(qs)
            return qs

    class AssessmentManager(models.Manager):
        def __init__(self, assessment_type=None):
            super().__init__()
            self.assessment_type = assessment_type

        @property
        def schema_cls(self):
            return self.assessment_type and _schema_cls_for_type(self.assessment_type)

        def get_queryset(self):
            qs = Assessment.QuerySet(self.model, using=self._db)
            qs = qs.annotate(type=models.F('schema_base__type'))
            if self.assessment_type:
                qs = qs.filter_type(self.assessment_type)

            return qs

        def generate_report(self, schema, subject_class=None):
            return schema.generate_report(subject_class=subject_class)

        def generate_progress(self, student, subject_node=None):
            return schema.generate_progress(student, subject_node=subject_node)

        def filter_node(self, subject_node, include_descendents=False):
            return self.get_queryset().filter_node(subject_node, include_descendents)

        def filter_class(self, subject_class):
            return self.get_queryset().filter_class(subject_class)

    objects = AssessmentManager()

    unit_assessments = AssessmentManager('unit-assessment')
    block_assessments = AssessmentManager('block-assessment')
    lesson_prelearning_assessments = AssessmentManager('lesson-prelearning-assessment')
    lesson_outcome_self_assessments = AssessmentManager('lesson-outcome-self-assessment')

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

    def __getattr__(self, name):
        if hasattr(self.schema, f'assessment__{name}'): 
            schema_prop = getattr(self.schema, f'assessment__{name}')
            return schema_prop(self)
        raise AttributeError
