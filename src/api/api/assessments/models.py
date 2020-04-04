from uuid import uuid4, UUID

from django.core import validators
from django.db import models

from api.base.models import BaseModel

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

class CompletionAttempt(Attempt):
    is_completed = models.BooleanField()

class RatedAttempt(Attempt):
    rating = models.PositiveSmallIntegerField()

    def percent_rating(self):
        return 100 * (self.rating / self.maximum_available_rating)

    class RatedAttemptManager(Attempt.AttemptManager):
        def get_queryset(self):
            return super().get_queryset().annotate(
                maximum_available_rating='maximum_available_rating'
            )

    objects = RatedAttemptManager()


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

    assessment_schema = models.ForeignKey('assessments.AssessmentSchema', on_delete=models.CASCADE)

    ## The subject class this was developed for
    subject_class = models.ForeignKey(SubjectClass, null=True, on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now=True)

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
    def candidate_ids(self):
        return (
            set(UUID(hex=id) for id in self._candidate_ids.split(':'))
            if self._candidate_ids else set()
        )

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
    def percent_attempted(self):
        if self.total_candidate_count == 0:
            return math.nan
        return 100 * (self.attempted_candidate_count / self.total_candidate_count)

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

    def generate(self):
        if self.id is None:
            self.id = uuid4()

        candidate_set = self._snapshot_candidate_set()

        self.total_candidate_count = candidate_set.count()
        self.candidate_ids = set(student.id for student in candidate_set)

        self.attempted_candidate_count = self.assessment_set.filter(is_attempted=True).count()
        candidate_ids = set(assessment.student_id for assessment in self.assessment_set)
        self.attempted_candidate_ids = set(assessment.student_id for assessment in self.assessment_set)
        return self


class RatingBasedReport(Report):
    passed_candidate_count = models.IntegerField()
    _passed_candidate_ids = models.TextField(default='')

    rating_average = models.FloatField()
    rating_std_dev = models.FloatField()
    best_acheived_rating = models.FloatField()

    best_rating_achieved_by = models.ForeignKey(Student, on_delete=models.CASCADE)

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


class CompletionBasedReport(Report):
    completed_candidate_count = models.IntegerField()
    _completed_candidate_ids = models.TextField(default='')

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
    def percent_completed(self):
        return (100 * self.completed_candidate_count) / self.total_candidate_count

    def generate(self):
        super().generate()
        completed_assessments = self.assessment_set.filter(is_completed=True)
        self.completed_candidate_count = completed_assessments.count()
        self.completed_candidate_ids = [assessment.student_id for assessment in completed_assessments]
        return self


###################################
##
## Assessment Schema definitions
##
###################################

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

        raise NotImplementedError('generate_report')


class CompletionBasedAssessmentSchema(AssessmentSchema):
    class Meta:
        abstract = True

    marking_type = 'completion-based'
    attempt_class = CompletionAttempt

    @classmethod
    def annotate_assessments(self, assessment_set):
        most_recent_attempts = (
            CompletionAttempt.objects
            .filter(assessment_id=models.OuterRef('id')).order_by('-attempt_number')
        )
        return assessment_set.annotate(
            is_attempted=models.Exists(most_recent_attempts),
            attempted_at=models.Subquery(most_recent_attempts.values('date')[:1]),
            is_completed=models.Subquery(most_recent_attempts.values('is_completed')[:1]),
        )

    def generate_report(self, subject_class=None):
        report = CompletionBasedReport(assessment_schema=self, subject_class=subject_class)
        report.generate().save()
        return report

class RatingsBasedAssessmentSchema(AssessmentSchema):
    class Meta:
        abstract = True

    marking_type = 'ratings-based'
    attempt_class = RatedAttempt
    report_class = CompletionBasedReport

    maximum_available_rating = models.PositiveSmallIntegerField(validators=[validators.MinValueValidator(1)])
    minimum_pass_mark = models.PositiveSmallIntegerField(null=True)

    @classmethod
    def annotate_assessments(self, assessment_set):
        most_recent_attempts = (
            RatedAttempt.objects
            .filter(assessment_id=models.OuterRef('id'))
            .order_by('-attempt_number')
        )    
        return assessment_set.annotate(
            is_attempted=models.Exists(most_recent_attempts),
            most_recent_attempt=models.Subquery(
                most_recent_attempts[:1], 
                field=models.OneToOneField(Attempt, null=True)
            ),
            attempted_at=models.Subquery(most_recent_attempts.values('date')[:1]),
            rating=models.Subquery(most_recent_attempts.values('rating')[:1]),
        )


    def generate_report(self, subject_class=None):
        report = RatingBasedReport(assessment_schema=self, subject_class=subject_class)
        report.generate().save()
        return report

####################################
##
## Leaf assessment types
##
####################################

class UnitAssessmentSchema(RatingsBasedAssessmentSchema):
    assessment_type     = 'unit-assessment'
    subject_node_class     = Unit

    @property
    def unit(self):
        return self.node.unit()

class BlockAssessmentSchema(RatingsBasedAssessmentSchema):
    assessment_type = 'block-assessment'
    subject_node_class = Block

    @property
    def block(self):
        return self.node.block()

class LessonPrelearningAssessmentSchema(CompletionBasedAssessmentSchema):
    assessment_type     = 'lesson-prelearning-assessment'
    subject_node_class = Lesson

    @property
    def lesson(self):
        return self.node.lesson()

    
class LessonOutcomeSelfAssessmentSchema(RatingsBasedAssessmentSchema):
    assessment_type = 'lesson-outcome-self-assessment'
    maximum_available_rating = models.PositiveSmallIntegerField(default=5)

    @property
    def lessonoutcome(self):
        return self.node.lessonoutcome()

def schema_class_for_type(assessment_type):
    if assessment_type is None:
        return None

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
        schema_class = schema_class_for_type(self.type)
        attempt_class = schema_class.attempt_class
        return attempt_class.objects.filter(assessment=self)

    @property
    def schema(self):
        schema_class = schema_class_for_type(self.type)
        return getattr(self.schema_base, schema_class.__name__.lower())


    class QuerySet(models.QuerySet):
        def filter_node(self, node_id, include_descendents=False):
            """
            Filter the assessments of the node `node_id`. 

            include_descents can either be:
                - a boolean (include all descendents)
                - a string (include all descendents of the given type)
            """

            if include_descendents:
                nodes = SubjectNode.objects.get_descendents(id=node_id)
            else:
                nodes = SubjectNode.objects.filter(id=node_id)
            return self.filter(schema_base__node_id__in=nodes)

        def filter_node(self, subject_node, include_descendents=False):
            if include_descendents:
                ## TODO: This shouldn't be difficult
                raise NotImplementedError('Can only select node exactly')

            return self.filter(schema_base__node=subject_node)

        def filter_class(self, subject_class):
            return self.filter(student__in=subject_class.students.all())

        def filter_student(self, student_id):
            return self.filter(student_id=student_id)

        def filter_type(self, assessment_type):
            qs = self.filter(type=assessment_type)

            schema_class = schema_class_for_type(assessment_type)
            qs = qs.select_related(f'schema_base__{schema_class.__name__.lower()}')

            related_attempts_name = schema_class.attempt_class.__name__.lower() + '_set'
            qs = qs.prefetch_related(related_attempts_name)

            qs = schema_class.annotate_assessments(qs)
            return qs

    class AssessmentManager(models.Manager):
        def __init__(self, assessment_type=None):
            super().__init__()
            self.assessment_type = assessment_type

        @property
        def schema_class(self):
            return schema_class_for_type(self.assessment_type)

        def get_queryset(self):
            qs = Assessment.QuerySet(self.model, using=self._db)
            qs = qs.annotate(type=models.F('schema_base__type'))
            if self.assessment_type:
                qs = qs.filter_type(self.assessment_type)

            return qs

        def generate_report(self, schema, subject_class=None):
            return schema.generate_report(subject_class=subject_class)

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
