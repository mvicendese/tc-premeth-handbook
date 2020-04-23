from django.db import models

from api.subjects.models import SubjectNode
from api.schools.models import Student

from api.base.models import (
    Document,
    comma_delimited_models_property,
    comma_delimited_model_count_property,
    calculated_percentage_property
)

from ..attempts.models import (
    AttemptType,
    CompletionState,
    GradeState
)


def _comma_delimited_assessments_property(delegate_prop):
    return comma_delimited_models_property('assessments.Assessment', delegate_prop)

def _comma_delimited_assessment_count_property(delegate_prop):
    return comma_delimited_model_count_property(delegate_prop)


class Progress(Document):
    """
    A progress represents a snapshot in time of a student's progression
    through a selection of assessments of the same type
    """
    class Meta:
        abstract = True

        indexes = [
            models.Index(
                fields=['assessment_schema_id', 'student_id', 'subject_node_id', ],
                name='index_%(class)s'
            )
        ]

        constraints = [
            models.UniqueConstraint(
                fields=['assessment_schema_id', 'student_id', 'subject_node_id', ],
                name='index_%(class)s'
            )    
        ]

    assessment_schema = models.ForeignKey('assessments.AssessmentSchema', related_name='+', on_delete=models.CASCADE)

    # This progress covers all data for the given student
    # The student must
    #   - Belong to the same school as the assessment schema
    #   - Belong to at least one subject class for the assessment schema's subject
    student = models.ForeignKey(Student, related_name='+', on_delete=models.CASCADE)

    # This progress covers all data for assessments of this type which were conducted
    # while completing this node
    #
    # The node must:
    #   - Be a node of the same subject as the assessment schema.
    #   - Be a strict ancestor node type of the node type of the assessment schema
    subject_node = models.ForeignKey(SubjectNode, related_name='+', on_delete=models.CASCADE)

    _assessment_ids             = models.TextField(default='')

    assessments                 = _comma_delimited_assessments_property('_assessment_ids')
    assessment_count            = _comma_delimited_assessment_count_property('_assessment_ids')

    _attempted_assessment_ids   = models.TextField(default='')

    attempted_assessments       = _comma_delimited_assessments_property('_attempted_assessment_ids')
    attempted_assessment_count  = _comma_delimited_assessment_count_property('_attempted_assessment_ids')

    @property
    def requires_regeneration(self):
        # TODO: Don't do this quite so much
        return True

    def generate(self):
        super().generate()

        self.assessments            = self.snapshot_assessment_set(only_attempted=False)
        self.attempted_assessments  = self.snapshot_assessment_set()
        return self

    def snapshot_assessment_set(self, only_attempted=True):
        from api.assessments.models import Assessment

        if not hasattr(self, '_snapshot_assessment_set'):
            qs = Assessment.objects_of_type(self.assessment_type)
            qs = qs.filter(student=self.student)

            if self.subject_node is not None:
                qs = qs.filter_node(self.subject_node, include_descendants=True)
            self._snapshot_assessment_set = qs

        assessment_set = self._snapshot_assessment_set
        if only_attempted:
            return assessment_set.filter(is_attempted=True)
        return assessment_set.all()

    @property
    def assessment_type(self):
        return self.assessment_schema.type

    @property
    def attempt_type(self):
        return self.assessment_schema.attempt_type

    percent_attempted = calculated_percentage_property('attempted_assessment_count', 'assessment_count')

    @staticmethod
    def objects_of_type(attempt_type):
        return {
            AttemptType.PASS_FAIL: PassFailProgress.objects,
            AttemptType.COMPLETION_BASED: CompletionBasedProgress.objects,
            AttemptType.RATED: RatedProgress.objects,
            AttemptType.GRADED: GradedProgress.objects
        }[attempt_type]

class PassFailProgress(Progress):
    _passed_assessments = models.TextField(default='')
    passed_assessments = _comma_delimited_assessments_property('_passed_assessments')
    passed_assessment_count = _comma_delimited_assessment_count_property('_passed_assessments')

    percent_passed =calculated_percentage_property('passed_assessment_count', 'attempted_assessment_count')

    def generate(self):
        super().generate()
        passed_assessments = self.snapshot_assessment_set().filter(is_pass=True)

        return self

class CompletionBasedProgress(Progress):
    _partially_complete_assessments         = models.TextField(default='')
    partially_complete_assessments          = _comma_delimited_assessments_property('_partially_completed_assessments')
    partially_complete_assessment_count     = _comma_delimited_assessment_count_property('_partially_completed_assessments')

    _complete_assessments                   = models.TextField(default='')
    complete_assessments                    = _comma_delimited_assessments_property('_complete_assessments')
    complete_assessment_count               = _comma_delimited_assessment_count_property('_complete_assessments')

    percent_partially_complete = calculated_percentage_property('partially_complete_assessment_count', 'attempted_assessment_count')

    percent_complete = calculated_percentage_property('complete_assessment_count', 'attempted_assessment_count')

    def generate(self):
        super().generate()

        partially_complete_assessments = (
            self.snapshot_assessment_set()
            .filter(completion_state__in=[CompletionState.PARTIALLY_COMPLETE, CompletionState.COMPLETE])
        )
        self.partially_complete_assessments = partially_complete_assessments

        complete_assessments = (
            self.snapshot_assessment_set()
            .filter(completion_state__in=[CompletionState.COMPLETE])
        )
        self.complete_assessments = complete_assessments

        return self



class GradedProgress(Progress):    
    _grade_f_assessment_ids                  = models.TextField(default='')
    grade_f_assessments                      = _comma_delimited_assessments_property('_grade_f_assessment_ids')
    grade_f_assessment_count                 = _comma_delimited_assessment_count_property('_grade_f_assessment_ids')

    _grade_d_plus_assessment_ids             = models.TextField(default='')
    grade_d_plus_assessments                 = _comma_delimited_assessments_property('_grade_d_plus_assessment_ids')
    grade_d_plus_assessment_count            = _comma_delimited_assessment_count_property('_grade_d_plus_assessment_ids')

    _grade_d_assessment_ids                  = models.TextField(default='')
    grade_d_assessments                      = _comma_delimited_assessments_property('_grade_d_assessment_ids')
    grade_d_assessment_count                 = _comma_delimited_assessment_count_property('_grade_d_assessment_ids')

    _grade_d_minus_assessment_ids            = models.TextField(default='')
    grade_d_minus_assessments                = _comma_delimited_assessments_property('_grade_d_minus_assessment_ids')
    grade_d_minus_assessment_count           = _comma_delimited_assessment_count_property('_grade_d_minus_assessment_ids')

    _grade_c_plus_assessment_ids             = models.TextField(default='')
    grade_c_plus_assessments                 = _comma_delimited_assessments_property('_grade_c_plus_assessment_ids')
    grade_c_plus_assessment_count            = _comma_delimited_assessment_count_property('_grade_c_plus_assessment_ids')

    _grade_c_assessment_ids                  = models.TextField(default='')
    grade_c_assessments                      = _comma_delimited_assessments_property('_grade_c_assessment_ids')
    grade_c_assessment_count                 = _comma_delimited_assessment_count_property('_grade_c_assessment_ids')

    _grade_c_minus_assessment_ids            = models.TextField(default='')
    grade_c_minus_assessments                = _comma_delimited_assessments_property('_grade_c_minus_assessment_ids')
    grade_c_minus_assessment_count           = _comma_delimited_assessment_count_property('_grade_c_minus_assessment_ids')

    _grade_b_minus_assessment_ids            = models.TextField(default='')
    grade_b_minus_assessments                = _comma_delimited_assessments_property('_grade_b_minus_assessment_ids')
    grade_b_minus_assessment_count           = _comma_delimited_assessment_count_property('_grade_b_minus_assessment_ids')

    _grade_b_assessment_ids                  = models.TextField(default='')
    grade_b_assessments                      = _comma_delimited_assessments_property('_grade_b_assessment_ids')
    grade_b_assessment_count                 = _comma_delimited_assessment_count_property('_grade_b_assessment_ids')

    _grade_b_plus_assessment_ids             = models.TextField(default='')
    grade_b_plus_assessments                 = _comma_delimited_assessments_property('_grade_b_plus_assessment_ids')
    grade_b_plus_assessment_count            = _comma_delimited_assessment_count_property('_grade_b_plus_assessment_ids')

    _grade_a_minus_assessment_ids            = models.TextField(default='')
    grade_a_minus_assessments                = _comma_delimited_assessments_property('_grade_a_minus_assessment_ids')
    grade_a_minus_assessment_count           = _comma_delimited_assessment_count_property('_grade_a_minus_assessment_ids')

    _grade_a_assessment_ids                  = models.TextField(default='')
    grade_a_assessments                      = _comma_delimited_assessments_property('_grade_a_assessment_ids')
    grade_a_assessment_count                 = _comma_delimited_assessment_count_property('_grade_a_assessment_ids')

    _grade_a_plus_assessment_ids             = models.TextField(default='')
    grade_a_plus_assessments                 = _comma_delimited_assessments_property('_grade_a_plus_assessment_ids')
    grade_a_plus_assessment_count            = _comma_delimited_assessment_count_property('_grade_a_plus_assessment_ids')

    def grade_assessments(self, grade):
        return getattr(self, f'grade_{grade.name.lower()}_assessments')

    def set_grade_assessments(self, grade, assessments):
        setattr(self, f'grade_{grade.name.lower()}_assessments', assessments)

    def grade_assessment_count(self, grade):
        return getattr(self, f'grade_{grade.name.lower()}_assessment_count')

    @property
    def grade_assessment_bins(self):
        return {
            grade: {
                'count': self.grade_candidate_count(grade), 
                'assessments': self.grade_assessments(grade)
            } for grade in GradeState
        }

    def generate(self):
        super().generate()

        assessment_set = self.snapshot_assessment_set()
        for grade in GradeState.values:
            grade_assessments = assessment_set.all().filter(grade=grade)
            self.set_grade_candidates(grade, grade_assessments)

        return self


class RatedProgress(Progress):
    _assessment_ratings = models.TextField(default='')

    @property
    def assessment_ratings(self):
        assessment_rating_pairs = (
            [rating.split(':') for rating in self._assessment_ratings]
            if self._assessment_ratings else []
        )

        return {
            UUID(hex=assessment_id): rating
            for assessment_id, rating in assessment_rating_pairs
        }

    @assessment_ratings.setter
    def assessment_ratings(self, ratings):
        pairs = [f'{assessment_id}:{rating}' for assessment_id, rating in ratings.items()]
        self._assessment_ratings = pairs.join(',')

    def generate(self):
        super().generate()

        assessments = self.snapshot_assessment_set()
        self.candidate_ratings = {
            result['id']: result['rating']
            for result in self.snapshot_assessment_set().values('id', 'rating')
        }
        return self