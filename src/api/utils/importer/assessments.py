
from uuid import uuid4
from collections import OrderedDict

from django.core.exceptions import ObjectDoesNotExist

from ._excel import get_workbook, col_index

from .subjects import Subject
from .schools import Student

class UnitAssessment():

    @classmethod
    def all_for_unit(cls, unit, student_model=None, assessment_model=None):
        all_students = Student.all(student_model=student_model)

        ws = get_workbook()['UnitAssessFeedback']
        student_key_col = col_index('A')
        unit_key_col = col_index('B')

        unit_rows = [
            row for row in ws
            if row[unit_key_col].value == unit.key
        ]

        def student_rows(student):
            return [
                row for row in unit_rows
                if row[student_key_col].value == student.row_key
            ]

        def unit_assessment_for_student(student):
            try:
                return assessment_model and assessment_model.unit_assessments.get(student_id=student.id, subject_node_id=unit.id)
            except assessment_model.DoesNotExist:
                pass

        return [
            cls(student, unit , student_rows(student), db_unit_assessment=unit_assessment_for_student(student))
            for student in all_students
        ]

    def __init__(self, student, unit, rows, db_unit_assessment=None):
        self.id = db_unit_assessment.id if db_unit_assessment else uuid4()
        self.db_unit_assessment = db_unit_assessment

        self.student = student

        self.unit = unit
        self.rows = rows

    @classmethod
    def assessment_data_row(cls, unit):
        ws = get_workbook()['UnitAssessData']

        unit_key_col = col_index('A')
        is_unit_assessment_row = lambda row: row[unit_key_col].value == unit.key
        return [row for row in ws if is_unit_assessment_row(row)][0]

    @classmethod
    def max_available_mark(cls, unit):
        return cls.assessment_data_row(unit)[col_index('D')].value


    @property
    def comment(self):
        return self.rows and self.rows[0][col_index('Q')].value

    @property
    def has_attempts(self):
        return all(attempt.raw_mark is not None for attempt in self.attempts)

    @property
    def attempts(self):
        if not hasattr(self, '_attempts'):
            def db_attempt_for_row(row):
                try:
                    return self.db_unit_assessment and self.db_unit_assessment.attempt_set.get(attempt_number=1)
                except ObjectDoesNotExist:
                    return None

            self._attempts = [
                UnitAssessmentAttempt(self, row, db_attempt=db_attempt_for_row(row))
                for row in self.rows
            ]
        return self._attempts
 
class UnitAssessmentAttempt():
    def __init__(self, unit_assessment, row, db_attempt=None):
        self.unit_assessment = unit_assessment

        self.db_attempt=db_attempt
        self.id = db_attempt.id if db_attempt else uuid4()

        self.unit_assess_feedback_row = row

    @property
    def date(self):
        return self.unit_assess_feedback_row[col_index('P')].value

    @property
    def raw_mark(self):
        return self.unit_assess_feedback_row[col_index('N')].value

    @property
    def mark_percent(self):
        return self.unit_assess_feedback_row[col_index('O')].value

class BlockAssessment():

    @classmethod
    def all_for_block(cls, block, student_model=None, block_assessment_model=None):
        all_students = Student.all(student_model=student_model)

        ws = get_workbook()['MiniAssessResults']
        student_key_col = col_index('A')
        block_key_col = col_index('B')

        block_rows = [
            row for row in ws
            if row[block_key_col].value == block.block_key
        ]

        def student_attempt_rows(student):
            return [
                row for row in block_rows
                if row[student_key_col].value == student.row_key
            ]

        def block_assessment_for_student(student):
            return block_assessment_model and block_assessment_model.get(student_id=student.id, block_id=block.id)

        return [
            cls(student, block, student_attempt_rows(student), db_block_assessment=block_assessment_for_student(student)) 
            for student in all_students
        ]   

    def __init__(self, student, block, attempt_rows, db_block_assessment=None):
        self.id = db_block_assessment.id if db_block_assessment else uuid4()
        self.db_block_assessment = db_block_assessment

        self.student = student 
        self.block = block
        self.attempt_rows = attempt_rows

    @classmethod
    def assessment_data_row(cls, block):
        ws = get_workbook()['MiniAssessData']

        unit_key_col = col_index('C')
        block_key_col = col_index('A')

        is_block_assessment_row = lambda row: (
            row[unit_key_col].value == block.unit.key
            and row[block_key_col].value == block.block_key
        )
        return [row for row in ws if is_block_assessment_row(row)][0]

    @classmethod
    def max_available_mark(cls, block):
        return cls.assessment_data_row(block)[col_index('F')].value

    @property
    def attempts(self):
        if not hasattr(self, '_attempts'):
            try:
                db_attempt = self.db_block_assessment and self.db_block_assessment.attempt_set.get(
                    attempt_number=row[col_index('I')].value
                )
            except ObjectDoesNotExist:
                db_attempt = None

            self._attempts = [
                BlockAssessmentAttempt(self, row, db_attempt=db_attempt)
                for row in self.attempt_rows
            ]
        return self._attempts


class BlockAssessmentAttempt():
    def __init__(self, block_assessment, row, db_attempt=None):
        self.block_assessment = block_assessment

        self.db_attempt=db_attempt
        self.id = db_attempt.id if db_attempt else uuid4()

        self.mini_assessments_row = row

    @property
    def attempt_number(self):
        return self.mini_assessments_row[col_index('I')].value

    @property
    def date(self):
        return self.mini_assessments_row[col_index('H')].value.date()

    @property
    def raw_mark(self):
        return self.mini_assessments_row[col_index('J')].value

    @property
    def mark_percent(self):
        return self.mini_assessments_row[col_index('K')].value

class LessonPrelearningAssessment():
    @classmethod
    def all_for_lesson(cls, lesson, student_model=None, lesson_prelearning_assessment_model=None):
        all_students = Student.all(student_model=student_model)

        ws = get_workbook()['PreLearn']
        lesson_key_col = col_index('C')

        lesson_rows = [row for row in ws if row[lesson_key_col].value == lesson.lessons_row_key]


        def prelearning_assessment_for_student(student):
            return lesson_prelearning_assessment_model and lesson_prelearning_assessment_model.objects.get(
                student_id=student.id,
                lesson_id=lesson.id
            )

        all_prelearning_assessments = (
            cls(
                lesson, 
                student, 
                lesson_rows,
                db_lesson_prelearning_assessment=prelearning_assessment_for_student(student)
            )
            for student in all_students
        )
        return (
            assessment
            for assessment in all_prelearning_assessments
            if assessment.has_attempts
        )


    def __init__(self, lesson, student, prelearn_worksheet_lesson_rows, db_lesson_prelearning_assessment=None):
        self.id = db_lesson_prelearning_assessment.id if db_lesson_prelearning_assessment else uuid4()
        self.db_lesson_prelearning_assessment = db_lesson_prelearning_assessment

        self.lesson = lesson
        self.prelearn_worksheet_lesson_rows = prelearn_worksheet_lesson_rows
        self.student = student

    @property
    def prelearn_worksheet_rows(self):
        if not hasattr(self, '_prelearn_worksheet_rows'):
            ws = get_workbook()['PreLearn']

            student_key_col = col_index('A')
            is_student_row = lambda row: row[student_key_col].value == self.student.row_key

            self._prelearn_worksheet_rows = [
                row for row in self.prelearn_worksheet_lesson_rows if is_student_row(row)
            ]
        return self._prelearn_worksheet_rows

    @property
    def has_attempts(self):
        if self.prelearn_worksheet_rows:
            return bool(self.prelearn_worksheet_rows)
        return False

    @property
    def prelearn_worksheet_row(self):
        return self.prelearn_worksheet_rows[0]

    @property       
    def date(self):
        return self.prelearn_worksheet_row[col_index('K')].value

    @property
    def rating(self):
        return self.prelearn_worksheet_row[col_index('L')].value


class LessonOutcomeSelfAssessment():
    @classmethod
    def all_for_lesson_outcome(cls, lesson_outcome, student_model=None, lesson_outcome_self_assessment_model=None):
        def lesson_outcome_self_assessment_for_student(student):
            return (
                lesson_outcome_self_assessment_model and 
                lesson_outcome_self_assessment_model.objects.get(
                    student_id=student.id,
                    lesson_id=lesson.id
                )
            )

        ws = get_workbook()['SelfAsses']
        ican_key_col = col_index('B')
        rating_col = col_index('L')

        is_outcome_row = lambda row: all([
            row[ican_key_col].value == lesson_outcome.ican_key,
            row[rating_col].value is not None
        ])

        lesson_outcome_rows = [ row for row in ws if is_outcome_row(row) ]

        all_students = Student.all(student_model=student_model)
        all_assessments = (
            LessonOutcomeSelfAssessment(
                lesson_outcome, 
                student, 
                lesson_outcome_rows,
                db_lesson_outcome_self_assessment=lesson_outcome_self_assessment_for_student(student)
            ) for student in all_students
        )
        return [assessment for assessment in all_assessments if assessment.has_attempt]

    def __init__(self, lesson_outcome, student, lesson_outcome_rows, db_lesson_outcome_self_assessment=None):
        self.id = db_lesson_outcome_self_assessment.id if db_lesson_outcome_self_assessment else uuid4()
        self.db_lesson_outcome_self_assessment = db_lesson_outcome_self_assessment

        self.lesson_outcome = lesson_outcome
        self.lesson_outcome_rows = lesson_outcome_rows
        self.student = student

    @property
    def self_assessment_rows(self):
        if not hasattr(self, '_self_assessment_rows'):
            student_key_col = col_index('A')
            ican_key_col = col_index('B')
            rating_col = col_index('L')

            self._self_assessment_rows = [
                row for row in self.lesson_outcome_rows 
                if row[student_key_col].value == self.student.row_key
            ]
        return self._self_assessment_rows
    
    @property
    def has_attempt(self):
        if self.lesson_outcome_rows:
            return bool(self.self_assessment_rows)
        return False

    @property
    def self_assessment_row(self):
        return self.self_assessment_rows[0]

    @property
    def date(self):
        return self.self_assessment_row[col_index('K')].value

    @property
    def rating(self):
        return self.self_assessment_row[col_index('L')].value

