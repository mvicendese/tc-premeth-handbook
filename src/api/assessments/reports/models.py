from uuid import UUID

from datetime import datetime
from django.db import models

from ext.django.db.models import Document

from base.models import (
    comma_delimited_models_property,
    comma_delimited_model_count_property,
    calculated_percentage_property
)
from schools.models import SubjectClass, Student
from subjects.models import SubjectNode

from assessments.attempts.models import (
    AttemptType,
    PassFailState,
    CompletionState,
    GradeState
)


def _comma_delimited_students_property(attr):
    return comma_delimited_models_property(Student, attr)

def _comma_delimited_student_count_property(attr):
    return comma_delimited_model_count_property(attr)


class Report(Document):
    """
    A report represents a snapshot in time of a group of students that have
    attempted a particular [:Assessment:] or [:AssessmentGroup:]
    """
    class Meta:
        abstract = True

        indexes = [
            models.Index(
                fields=['assessment_schema_id', 'subject_node_id', 'subject_class_id'],
                name='index_%(class)s'
            )
        ]

        constraints = [
            models.UniqueConstraint(
                fields=['assessment_schema_id', 'subject_node_id', 'subject_class_id'],
                 name='unique_%(class)s'
           ),
           models.UniqueConstraint(
                fields=['assessment_schema_id', 'subject_node_id'],
                condition=models.Q(subject_class_id=None),
                name='unique_wo_class_%(class)s'
           )
        ]


    assessment_schema = models.ForeignKey('assessments.AssessmentSchema', related_name='+', on_delete=models.CASCADE)

    # This report covers all data for the given node.
    # The subject node must:
    #   - Belong to the same subject as the assessment schema.
    #   - Be of the same node type as the associated schema.
    subject_node = models.ForeignKey(SubjectNode, related_name='+', on_delete=models.CASCADE)

    # Filters which affect the assessments included in the report

    # If provided, the subject class must:
    #    - belong to the same subject as the assessment schema
    #    - belong to the same school as the assessment schema
    # 
    # A null subject_class will generate a report covering all students in all classes at the school.
    subject_class = models.ForeignKey(SubjectClass, related_name='+', null=True, on_delete=models.CASCADE)

    _candidate_ids                  = models.TextField(default='')

    candidates                      = _comma_delimited_students_property('_candidate_ids')
    candidate_count                 = _comma_delimited_student_count_property('_candidate_ids')

    _attempt_candidate_ids          = models.TextField(default='')

    attempted_candidates              = _comma_delimited_students_property('_attempt_candidate_ids')
    attempted_candidate_count         = _comma_delimited_student_count_property('_attempt_candidate_ids')

    @property
    def requires_regeneration(self):
        # TODO: Don't generate quite as much
        return True

    def generate(self):
        if self.generation == 1:
            self.candidates = self.snapshot_candidate_ids()

        attempted_assessments = self.snapshot_assessment_set().only('student_id')
        self.attempted_candidates = [assessment.student_id for assessment in attempted_assessments]

        return super().generate()

    @property
    def assessment_type(self):
        return self.assessment_schema.type

    @property
    def attempt_type(self):
        return self.assessment_schema.attempt_type

    def get_assessment_option(self, name):
        return self.assessment_schema.get_option(self.subject_node, name)

    percent_attempted = calculated_percentage_property('attempted_candidate_count', 'candidate_count')

    def snapshot_candidate_ids(self):
        """
        The candidate set is the set of candidates which were 
        in one of the subject classes of the assessment 
        __at the time the report was created__.

        It will not be refreshed if the report is regenerated,
        since students who enter the class late should not be
        expected to take previous assessments.
        """
        subject_classes = (
            SubjectClass.objects.filter(
                school=self.assessment_schema.school,
                subject=self.assessment_schema.subject,
                year=datetime.now().year
            )
            if self.subject_class is None 
            else [self.subject_class]
        ) 
        students = (
            Student.objects
           .filter(subjectclass__in=subject_classes)
        )

        return [student.id for student in students.only('id')]

        if self.subject_class is None:
            return [
                cls.id 
                for cls in SubjectClass.objects.filter(
                    school=self.assessment_schema.school,
                    subject=self.assessment_schema.subject,
                    year=datetime.now().year
                ).only('id')]
        else:
            return self.subject_class.student_set.only('id')

    def snapshot_assessment_set(self):
        if not hasattr(self, '_snapshot_assessment_set'):
            from api.assessments.models import Assessment

            qs = Assessment.objects_of_type(self.assessment_type)
            qs = qs.filter_node(self.subject_node, include_descendants=False)
            if self.subject_class is not None:
                qs = qs.filter_class(self.subject_class)
            qs = qs.filter(attempted_at__isnull=False)
            self._snapshot_assessment_set = qs

        return self._snapshot_assessment_set.all()

    @staticmethod
    def objects_of_type(attempt_type):
        return {
            AttemptType.PASS_FAIL: PassFailReport.objects,
            AttemptType.COMPLETION_BASED: CompletionBasedReport.objects,
            AttemptType.RATED: RatedReport.objects,
            AttemptType.GRADED: GradedReport.objects
        }[attempt_type]

class PassFailReport(Report):
    _passed_candidate_ids         = models.TextField(default='')
    passed_candidates             = _comma_delimited_students_property('_passed_candidate_ids')
    passed_candidate_count        = _comma_delimited_student_count_property('_passed_candidate_ids')

    percent_passed = calculated_percentage_property('passed_candidate_count', 'attempted_candidate_count')

    def generate(self):
        super().generate()
        passed_assessments = (
            self.snapshot_assessment_set()
            .filter(is_pass=True)
        )

        self.passed_candidates = [assessment.student_id for assessment in passed_assessments]
        return self

class CompletionBasedReport(Report):
    _partially_complete_candidate_ids       = models.TextField(default='')
    partially_complete_candidates           = _comma_delimited_students_property('_partially_complete_candidate_ids')
    partially_complete_candidate_count      = _comma_delimited_student_count_property('_partially_complete_candidate_ids')

    _complete_candidate_ids                 = models.TextField(default='')
    complete_candidates                     = _comma_delimited_students_property('_complete_candidate_ids')
    complete_candidate_count                 = _comma_delimited_student_count_property('_complete_candidate_ids')

    percent_partially_complete = calculated_percentage_property('partially_complete_candidate_count', 'attempted_candidate_count')
    percent_complete = calculated_percentage_property('complete_candidate_count', 'attempted_candidate_count')

    def generate(self):
        super().generate()
        partially_complete_assessments = (
            self.snapshot_assessment_set()
            .filter(completion_state__in=[CompletionState.PARTIALLY_COMPLETE, CompletionState.COMPLETE])
        )
        self.partially_complete_candidates = [ass.student_id for ass in partially_complete_assessments]

        complete_assessments = (
            self.snapshot_assessment_set()
            .filter(completion_state=CompletionState.COMPLETE)
        )
        self.complete_candidates = [ass.student_id for ass in complete_assessments]
        return self


class GradedReport(Report):    
    _grade_f_candidate_ids                  = models.TextField(default='')
    grade_f_candidates                      = _comma_delimited_students_property('_grade_f_candidate_ids')
    grade_f_candidate_count                 = _comma_delimited_student_count_property('_grade_f_candidate_ids')

    _grade_d_plus_candidate_ids             = models.TextField(default='')
    grade_d_plus_candidates                 = _comma_delimited_students_property('_grade_d_plus_candidate_ids')
    grade_d_plus_candidate_count            = _comma_delimited_student_count_property('_grade_d_plus_candidate_ids')

    _grade_d_candidate_ids                  = models.TextField(default='')
    grade_d_candidates                      = _comma_delimited_students_property('_grade_d_candidate_ids')
    grade_d_candidate_count                 = _comma_delimited_student_count_property('_grade_d_candidate_ids')

    _grade_d_minus_candidate_ids            = models.TextField(default='')
    grade_d_minus_candidates                = _comma_delimited_students_property('_grade_d_minus_candidate_ids')
    grade_d_minus_candidate_count           = _comma_delimited_student_count_property('_grade_d_minus_candidate_ids')

    _grade_c_plus_candidate_ids             = models.TextField(default='')
    grade_c_plus_candidates                 = _comma_delimited_students_property('_grade_c_plus_candidate_ids')
    grade_c_plus_candidate_count            = _comma_delimited_student_count_property('_grade_c_plus_candidate_ids')

    _grade_c_candidate_ids                  = models.TextField(default='')
    grade_c_candidates                      = _comma_delimited_students_property('_grade_c_candidate_ids')
    grade_c_candidate_count                 = _comma_delimited_student_count_property('_grade_c_candidate_ids')

    _grade_c_minus_candidate_ids            = models.TextField(default='')
    grade_c_minus_candidates                = _comma_delimited_students_property('_grade_c_minus_candidate_ids')
    grade_c_minus_candidate_count           = _comma_delimited_student_count_property('_grade_c_minus_candidate_ids')

    _grade_b_minus_candidate_ids            = models.TextField(default='')
    grade_b_minus_candidates                = _comma_delimited_students_property('_grade_b_minus_candidate_ids')
    grade_b_minus_candidate_count           = _comma_delimited_student_count_property('_grade_b_minus_candidate_ids')

    _grade_b_candidate_ids                  = models.TextField(default='')
    grade_b_candidates                      = _comma_delimited_students_property('_grade_b_candidate_ids')
    grade_b_candidate_count                 = _comma_delimited_student_count_property('_grade_b_candidate_ids')

    _grade_b_plus_candidate_ids             = models.TextField(default='')
    grade_b_plus_candidates                 = _comma_delimited_students_property('_grade_b_plus_candidate_ids')
    grade_b_plus_candidate_count            = _comma_delimited_student_count_property('_grade_b_plus_candidate_ids')

    _grade_a_minus_candidate_ids            = models.TextField(default='')
    grade_a_minus_candidates                = _comma_delimited_students_property('_grade_a_minus_candidate_ids')
    grade_a_minus_candidate_count           = _comma_delimited_student_count_property('_grade_a_minus_candidate_ids')

    _grade_a_candidate_ids                  = models.TextField(default='')
    grade_a_candidates                      = _comma_delimited_students_property('_grade_a_candidate_ids')
    grade_a_candidate_count                 = _comma_delimited_student_count_property('_grade_a_candidate_ids')

    _grade_a_plus_candidate_ids             = models.TextField(default='')
    grade_a_plus_candidates                 = _comma_delimited_students_property('_grade_a_plus_candidate_ids')
    grade_a_plus_candidate_count            = _comma_delimited_student_count_property('_grade_a_plus_candidate_ids')

    def grade_candidates(self, grade):
        return getattr(self, f'grade_{grade_state.name.lower()}_candidates')

    def set_grade_candidates(self, grade, candidates):
        setattr(self, f'grade_{grade_state.name.lower()}_candidates', candidates)

    def grade_candidate_count(self, grade):
        return getattr(self, f'grade_{grade_state.name.lower()}_count')

    @property
    def grade_candidates_bins(self):
        """
        A mapping from grades to the count of candidates at that grade
        and the candidates which achieved the grade
        """
        return {
            grade: {
                'count': self.grade_candidate_count(grade),
                'candidates': self.grade_candidates(grade)
            }
        }

    def generate(self):
        super().generate()
        assessment_set = self.snapshot_assessment_set()

        for grade in GradeState.values:
            grade_assessments = assessment_set.all().filter(grade=grade)
            self.set_grade_candidates(grade, [
                assessment.student_id
                for assessment in grade_assessments.only('candidate_id')
            ])

class RatedReport(Report):
    rating_average          = models.DecimalField(decimal_places=2, max_digits=5, null=True)
    rating_std_dev          = models.DecimalField(decimal_places=2, max_digits=5, null=True)

    _candidate_ratings = models.TextField(default='')

    @property
    def candidate_ratings(self):
        candidate_rating_pairs = (
            [rating.split(':') for rating in self._candidate_ratings.split(',')] 
            if self._candidate_ratings else []
        )
        return {
            UUID(hex=candidate_id): rating
            for candidate_id, rating in candidate_rating_pairs
        }

    @candidate_ratings.setter
    def candidate_ratings(self, ratings):
        pairs = [f'{candidate_id}:{rating}' for candidate_id, rating in ratings.items()]
        self._candidate_ratings = ','.join(pairs)

    @property
    def max_available_rating(self):
        return self.get_assessment_option('max_available_rating')

    def generate(self):
        super().generate()

        assessment_set = self.snapshot_assessment_set()
        self.candidate_ratings = {
            result['student_id']: result['rating']
            for result in assessment_set.values('student_id', 'rating')
        }

        self.rating_average = assessment_set.aggregate(rating_average=models.Avg('rating'))['rating_average'] or 0
        self.rating_std_dev = assessment_set.aggregate(rating_std_dev=models.StdDev('rating'))['rating_std_dev'] or 0

        return self




