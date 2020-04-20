
from django.db import models
from django.utils.translation import gettext_lazy as _

from api.base.models import BaseModel, calculated_percentage_property



class PassFailState(models.TextChoices):
    FAIL                = 'fail',               _('fail')
    PASS                = 'pass',               _('pass')

class PassFailStateField(models.CharField):
    def __init__(self, *args, **kwargs):
        if 'max_length' in kwargs:
            raise KeyError('max_length is an invalid argument for a PassStateField')
        if 'choices' in kwargs:
            raise KeyError('choices is an invalid argument for a PassStateField')
        kwargs.update(
            max_length=4,
            choices=PassFailState.choices
        )    
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs = dict(kwargs)
        kwargs.pop('max_length')
        kwargs.pop('choices')
        return name, path, args, kwargs

class CompletionState(models.TextChoices):
    NONE                = 'none',                _('none')
    PARTIALLY_COMPLETE 	= 'partially-complete',  _('partially complete')
    COMPLETE            = 'complete',            _('complete')


class PartialCompletionStateField(models.CharField):
    def __init__(self, *args, **kwargs):
        if 'max_length' in kwargs:
            raise KeyError('Max length of partial completion state field is fixed')
        if 'choices' in kwargs:
            raise KeyError('choices is fixed for ParticlCompletionstateField')

        kwargs.update(
            max_length=20,
            choices=CompletionState.choices
        )
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs = dict(kwargs)
        kwargs.pop('max_length', None)
        kwargs.pop('choices', None)
        return name, path, args, kwargs


class GradeState(models.TextChoices):
    A_PLUS              = 'A+',                _('A+')
    A                   = 'A',                 _('A')
    A_MINUS             = 'A-',                _('A-')
    B_PLUS              = 'B+',                _('B+')
    B                   = 'B',                 _('B')
    B_MINUS             = 'B-',                _('B-')
    C_PLUS              = 'C+',                _('C+')
    C                   = 'C',                 _('C')
    C_MINUS             = 'C-',                _('C-')
    D_PLUS              = 'D+',                _('D+')
    D                   = 'D',                 _('D')
    D_MINUS             = 'D-',                _('D-')
    F                   = 'F',                 _('F')


class GradeStateField(models.CharField):
    def __init__(self, *args, **kwargs):
        if 'max_length' in kwargs:
            raise KeyError('max_length is an invalid argument for GradeStateField')
        if 'choices' in kwargs:
            raise KeyError('choices is an invalid argument for GradeStateField')
        kwargs.update(
            max_length=2,
            choices=GradeState.choices
        )
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs = dict(kwargs)

        kwargs.pop('max_length', None)
        kwargs.pop('choices', None)

        return name, path, args, kwargs


class AttemptType(models.TextChoices):
    PASS_FAIL        = 'pass/fail',         _('strict pass or fail')
    COMPLETION_BASED = 'completion-based',  _('completion based')
    RATED            = 'rated',             _('rated')    
    GRADED           = 'graded',            _('graded')


class AttemptTypeField(models.CharField):
    def __init__(self, *args, **kwargs):
        if 'max_length' in kwargs:
            raise KeyError('max_length is an invalid argument for AttemptTypeField')
        if 'choices' in kwargs:
            raise KeyError('choices is an invalid argument for AttemptTypeField')
        kwargs.update(
            max_length=16,
            choices=AttemptType.choices
        )
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs = dict(kwargs)

        kwargs.pop('max_length', None)
        kwargs.pop('choices', None)

        return name, path, args, kwargs


class RatingField(models.PositiveSmallIntegerField):
    def __init__(self, *args, max_rating=None, max_rating_field=None, **kwargs):
        self.max_rating = max_rating
        self.max_rating_field = max_rating_field
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()

        if self.max_rating is not None:
            kwargs['max_rating'] = self.max_rating
        if self.max_rating_field is not None:
            kwargs['max_rating_field'] = self.max_rating_field

        return name, path, args, kwargs


class Attempt(BaseModel):
    class Meta:
        abstract = True

    attempt_type = AttemptTypeField()
    assessment = models.ForeignKey('assessments.Assessment', related_name='+', on_delete=models.CASCADE)
    attempt_number = models.PositiveSmallIntegerField()

    @property 
    def assessment_schema(self):
        return self.assessment.schema

    @property
    def assessment_type(self):
        return self.assessment.type

    class QuerySet(models.QuerySet):
        def significant_attempt_numbers(self, max_significant_attempts=None):
            """
            A set of attempts has a configurable number of attempts that are used when calculating
            the mark for the assessment.

            If [:max_significant_attempts:] is `None`, then all attempts are used when calculating
            the mark

            If [:max_significant_attempts:] is an int,  then only the most recent (when ordering by 
            [:attempt_number:] attempts are used to calculate the mark.
            """ 
            if isinstance(max_significant_attempts, int):
                return self.order_by('-attempt_number')[:max_significant_attempts].values('id')
            return self.order_by('-attempt_number').values('id')


        def filter_significant(self, max_significant_attempts=None):
            """
            Include only the significant attempts in the queryset
            """
            return self.filter(attempt_number__in=self.significant_attempt_numbers(max_significant_attempts))

        def max_attempt_number(self):
            return self.aggregate(max_attempt_number=models.Max('attempt_number'))['max_attempt_number'] or 0

        def create(self, *args, assessment=None, **kwargs):
            if assessment is None:
                raise ValueError('An assessment is required')

            kwargs = dict(kwargs)
            kwargs.update(
                assessment=assessment,
                attempt_number=self
                    .filter(assessment=assessment)
                    .max_attempt_number() + 1
            )
            return super().create(*args, **kwargs)

    class Manager(models.Manager):
        def __init__(self, attempt_type, attempt_parameters=None):
            self.attempt_type = attempt_type 

            # Attempt parameters are parameters provided by either the 
            # assessment or the schema and are used to parameterise the 
            # creation of attempts
            self.attempt_parameters = attempt_parameters or []
            super().__init__()

        def create(self, *args, assessment=None, **kwargs):
            kwargs.update(attempt_type=self.attempt_type)
            if assessment is None:
                raise ValueError('An assessment is required to create an attempt')

            kwargs = dict(kwargs)
            for param in self.attempt_parameters:
                kwargs[param] = assessment.get_attempt_argument(param)

            return super().create(*args, assessment=assessment, **kwargs)

        def annotate_assessments(self, assessments):
            has_attempts = (
                self.get_queryset().filter(assessment_id=models.OuterRef('id'))
                .order_by('-attempt_number')
            )
            return assessments.annotate(
                is_attempted=models.Exists(has_attempts),
                attempted_at=models.Subquery(has_attempts.values('created_at')[:1])
            )

    @staticmethod
    def objects_of_type(attempt_type):
        if attempt_type == AttemptType.PASS_FAIL:
            return PassFailAttempt.objects
        elif attempt_type == AttemptType.COMPLETION_BASED:
            return CompletionBasedAttempt.objects
        elif attempt_type == AttemptType.RATED:
            return RatedAttempt.objects
        elif marking_type == AttemptType.GRADED:
            return GradedAttempt.objects
        else:
            raise ValueError(f'Unrecognised attempt type: {attempt_type}')


class PassFailAttempt(Attempt):
    state = PassFailStateField()

    @property
    def is_pass(self):
        return self.state == PassFailState.PASS

    class Manager(Attempt.Manager):
        def __init__(self):
            super().__init__(AttemptType.PASS_FAIL)

        def annotate_assessments(self, assessment_set):
            is_pass = (
                self.get_queryset()
                .filter(assessment_id=models.OuterRef('id'), state=PassFailState.PASS)
            )
            return assessment_set.annotate(
                is_pass=models.Exists(is_pass)
            )

    objects = Manager.from_queryset(Attempt.QuerySet)()


class CompletionBasedAttempt(Attempt):
    state = PartialCompletionStateField()

    @property
    def is_partially_complete(self):
        return self.state in [CompletionState.PARTIALLY_COMPLETE, CompletionState.COMPLETE]

    @property
    def is_complete(self):
        return self.state == CompletionState.COMPLETE

    class Manager(Attempt.Manager):
        def __init__(self):
            super().__init__(AttemptType.COMPLETION_BASED)

        def annotate_assessments(self, assessment_set):
            assessment_set = super().annotate_assessments(assessment_set)

            most_recent_state = (
                self.get_queryset()
                .filter(assessment_id=models.OuterRef('id'), attempt_number=self.max_attempt_number())
            )
            return assessment_set.annotate(
                is_complete=models.Exists(most_recent_state.filter(state=CompletionState.COMPLETE)),
                is_partially_complete=models.Exists(most_recent_state.filter(state=CompletionState.PARTIALLY_COMPLETE)),
                completion_state=models.Subquery(most_recent_state.values('state'))
            )

    objects = Manager.from_queryset(Attempt.QuerySet)()


class RatedAttempt(Attempt):
    max_available_rating = models.PositiveSmallIntegerField()

    rating = RatingField(max_rating_field='max_available_rating')
    rating_percent = calculated_percentage_property('rating', 'max_available_rating')

    class Manager(Attempt.Manager):
        def __init__(self):
            super().__init__(AttemptType.RATED, attempt_parameters=['max_available_rating'])

        def assessment_set_has_attempts(self, assessment_set):
            return self.filter(assessment__in=assessment_set).exists()

        def annotate_assessments(self, assessment_set):
            assessment_set = super().annotate_assessments(assessment_set)

            # TODO: This doesn't have to be the most recent rating.
            #       It could be configured in the options, if 
            most_recent_rating = (
                self.get_queryset()
                .filter(assessment_id=models.OuterRef('id'))
                .order_by('-attempt_number')[:1]
            )

            return assessment_set.annotate(
                max_available_rating=models.Subquery(most_recent_rating.values('max_available_rating')),
                rating=models.Subquery(most_recent_rating.values('rating'))
            )

    objects = Manager.from_queryset(Attempt.QuerySet)()


class GradedAttempt(Attempt):
    grade = GradeStateField()

    class Manager(Attempt.Manager):
        def __init__(self):
            super().__init__(AttemptType.GRADED)

        def annotate_assessments(self, assessment_set):
            assessment_set = super().annotate_assessments(assessment_set)

            most_recent_grade = (
                self.get_queryset()
                .filter(assessment_id=models.OuterRef('id'))
                .order_by('-attempt_number')
                .values('grade')[:1]
            )

            assessment_set.annotate(
                grade=models.Subquery(most_recent_grade)
            )

    objects = Manager.from_queryset(Attempt.QuerySet)()







