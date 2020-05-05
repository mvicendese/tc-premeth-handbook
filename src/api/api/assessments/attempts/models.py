from django.core.exceptions import ObjectDoesNotExist

from django.db import models
from django.utils.translation import gettext_lazy as _

from ext.django.db.models import BaseModel
from api.base.models import calculated_percentage_property



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

    def get_assessment_option(self, name):
        return self.assessment.get_option(name)

    class QuerySet(models.QuerySet):
            
        def annotate_assessment_options(self, attempt_parameters):
            """
            Annotates any assessment options for the current subject node
            onto the assessment instance
            """
            from api.assessments.models import AssessmentOptions

            assessment_options = (AssessmentOptions.objects
                .filter_subject_node_or_defaults(
                    schema_id=models.OuterRef('schema_id'), 
                    subject_node_id=models.OuterRef('subject_node_id')))

            annotations = {}
            for param in attempt_parameters:
               annotations[param] = assessment_options.option_values(attempt_parameters[param])[:1]

            return self.annotate(
                schema_id=models.F('assessment__schema_id'),
                subject_node_id=models.F('assessment__subject_node_id')
            ).annotate(**annotations)

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

            # Attempt parameters are parameters provided by the AssessmentOptions
            # of the assessment schema.
            self.attempt_parameters = attempt_parameters or {}

            super().__init__()

        def get_queryset(self):
            return (super()
                .get_queryset()
                .annotate_assessment_options(self.attempt_parameters))

        def create(self, *args, assessment=None, **kwargs):
            kwargs.update(attempt_type=self.attempt_type)
            if assessment is None:
                raise ValueError('An assessment is required to create an attempt')

            return super().create(*args, assessment=assessment, **kwargs)

        @property
        def assessment_properties(self):
            def get_is_attempted(assessment):
                return assessment.attempt_set.exists()

            def get_attempted_at(assessment):
                try:
                    last_assessment = assessment.attempt_set.last() 
                    return last_assessment.created_at
                except ObjectDoesNotExist:
                    return None

            return dict(
                is_attempted=property(get_is_attempted),
                attempted_at=property(get_attempted_at)
            )

        def annotate_assessments(self, assessments):
            has_attempts = (
                self.get_queryset().filter(assessment_id=models.OuterRef('id'))
                .order_by('-attempt_number')
            )
            return assessments.annotate(
                is_attempted=models.Exists(has_attempts),
                attempted_at=models.Subquery(has_attempts.values('created_at')[:1])
            )

        def get_assessment_option(self, schema, subject_node, name):
            if name not in self.attempt_parameters:
                raise KeyError('option must be declared in attempt manager\'s parameter list')
            return AssessmentOptions.get(schema=schema, subject_node=subject_node).get_option(name)


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
        def __init__(self, **kwargs):
            super().__init__(AttemptType.PASS_FAIL, **kwargs)

        @property
        def assessment_properties(self):
            def get_is_pass(assessment):
                try: 
                    attempt = self.attempt_set.last()
                    return attempt.state == PassFailState.PASS
                except ObjectDoesNotExist:
                    return None

            props = dict(super().assessment_properties)
            props.update(
                is_pass=property(get_is_pass)
            )
            return props

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
        def __init__(self, **kwargs):
            super().__init__(AttemptType.COMPLETION_BASED, **kwargs)

        @property
        def assessment_properties(self):
            def get_completion_state(assessment):
                try:
                    attempt = assessment.attempt_set.last()
                    return attempt.state
                except ObjectDoesNotExist:
                    return None

            def get_is_partially_complete(assessment):
                return assessment.completion_state in {CompletionState.PARTIALLY_COMPLETE, CompletionState.COMPLETE}

            def get_is_complete(assessment):
                return assessment.completion_state == CompletionState.COMPLETE

            props = dict(super().assessment_properties)
            props.update(
                completion_state=property(get_completion_state),
                is_partially_complete=property(get_is_partially_complete),
                is_complete=property(get_is_complete)
            )
            return props

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

    rating = RatingField(max_rating_field='max_available_rating')
    #rating_percent = calculated_percentage_property('rating', 'max_available_rating')

    class Manager(Attempt.Manager):
        def __init__(self, **kwargs):
            super().__init__(AttemptType.RATED, attempt_parameters={'max_available_rating': 'ratedattempt_max_available_rating'}, **kwargs)

        def get_queryset(self):
            return (super().get_queryset()
                .annotate(
                   rating_percent=models.F('rating') / models.F('max_available_rating')
                ))

        def max_available_rating(self):
            return self.assessment.get_option('ratedattempt_max_available_rating')

        def assessment_set_has_attempts(self, assessment_set):
            return self.filter(assessment__in=assessment_set).exists()

        @property
        def assessment_properties(self):
            def rating(assessment):
                try:
                    attempt = assessment.attempt_set.last()
                    return attempt.rating
                except ObjectDoesNotExist:
                    return None

            def max_available_rating(assessment):
                return assessment.get_option('ratedattempt_max_available_rating')

            def rating_percent(assessment):
                try:
                    attempt = assessment.attempt_set.last()
                    return attempt.rating_percent
                except ObjectDoesNotExist:
                    return None

            props = dict(super().assessment_properties)
            props.update(
                rating=property(rating),
                max_available_rating=property(max_available_rating),
                rating_percent=property(rating_percent)
            )
            return props


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
                rating=models.Subquery(most_recent_rating.values('rating'))
            )

    objects = Manager.from_queryset(Attempt.QuerySet)()


class GradedAttempt(Attempt):
    grade = GradeStateField()

    class Manager(Attempt.Manager):
        def __init__(self, **kwargs):
            super().__init__(AttemptType.GRADED, **kwargs)

        @property
        def assesment_poroperties(self):
            def get_grade(assessment):
                try:
                    assessment = assessment.attempt_set.last()
                    return attempt.grade
                except ObjectDoesNotExist:
                    return None

            props = dict(super().assessment_properties)
            props.update(
                grade=property(get_grade)
            )
            return props


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







