from collections import OrderedDict
from uuid import uuid4

from ._excel import get_workbook, col_index

class School():
	@classmethod
	def tc_school(cls, school_model=None):
		db_school = school_model and school_model.objects.get(
			name='Templestowe College'
		)
		return School('Templestowe College', db_school=db_school)

	@classmethod
	def all(cls, school_model=None):
		return [
			cls.tc_school(school_model=school_model)
		]

	def __init__(self, name, db_school=None):
		self.name = name
		self.db_school = db_school

		self.id = db_school and db_school.id or uuid4()

	def students(self, student_model=None):
		if not hasattr(self, '_students'):
			self._students = list(Student.all(student_model=student_model))
		return self._students	

class Teacher():
	@classmethod
	def mvi_teacher(cls, teacher_model=None):
		db_teacher = teacher_model and teacher_model.objects.get(teacher_code='MVI')
		return Teacher('MVI', 'Matthew', 'VICENDESE', db_teacher=db_teacher)

	@classmethod
	def eraw_teacher(cls, teacher_model=None):
		db_teacher = teacher_model and teacher_model.objects.get(teacher_code='ERAW')
		return Teacher('ERAW', 'Ekta', 'RAWAL', db_teacher=db_teacher)

	@classmethod
	def all(cls, teacher_model=None):
		return [
			cls.mvi_teacher(teacher_model=teacher_model),
			cls.eraw_teacher(teacher_model=teacher_model)
		]

	def __init__(self, teacher_code, first_name, surname, db_teacher=None):
		self.db_teacher = db_teacher
		self.id = db_teacher and db_teacher.id

		self.teacher_code = teacher_code
		self.first_name = first_name
		self.last_name = surname 

	@property
	def email(self):
		return self.teacher_code.lower() + '@tc.vic.edu.au'

class Student():
	@classmethod
	def all(cls, student_model=None):
		ws = get_workbook()['StudentData']
		student_key_col = col_index('A')
		student_worksheet_rows = (row for row in list(ws)[1:] if row[student_key_col].value is not None)

		def student_for_row(row):
			student_code = row[col_index('D')].value
			try:
				return student_model and student_model.objects.get(student_code=student_code)
			except ObjectDoesNotExist:
				return None

		return (
			cls(row, db_student=student_for_row(row))
			for row in student_worksheet_rows
		)

	def __init__(self, students_worksheet_row, db_student=None):
		self.id = db_student.id if db_student else uuid4()
		self.db_student = db_student
		self.students_worksheet_row = students_worksheet_row

	@property
	def email(self):
		return self.code + '@tc.vic.edu.au'

	@property
	def full_name(self):
		return f'{self.first_name} {self.surname}'

	@property		
	def row_key(self):
		return self.students_worksheet_row[col_index('A')].value

	@property
	def code(self):
		return self.students_worksheet_row[col_index('D')].value

	@property
	def first_name(self):
		return self.students_worksheet_row[col_index('B')].value

	@property
	def surname(self):
		return self.students_worksheet_row[col_index('C')].value

	@property
	def year_level(self):
		return self.students_worksheet_row[col_index('F')].value

	@property
	def compass_number(self):
		return self.students_worksheet_row[col_index('M')].value

	@property
	def class_code(self):
		return self.students_worksheet_row[col_index('I')].value

class Class():
	@classmethod
	def all(cls, subject, subject_class_model=None):
		students_worksheet = get_workbook()['StudentData']
		class_code_col = col_index('I')
		
		all_class_codes = OrderedDict(
			(row[class_code_col].value, None) 
			for row in students_worksheet
			if (row[class_code_col].value or '').startswith(subject.name)
		).keys()

		def subject_class_for_code(code):
			if not subject_class_model:
				return None
			return subject_class_model.objects.get(subject_id=subject.id, subgroup=name[len(subject.name):])
			
		return (
			cls(
				subject, 
				2020, 
				class_code,
				db_subject_class=subject_class_for_code(class_code)
			) 
			for class_code in all_class_codes
		)

	def __init__(self, subject, year, code, db_subject_class=None):
		self.id = db_subject_class.id if db_subject_class else uuid4()
		self.db_subject_class = db_subject_class

		self.subject = subject 
		self.year = year
		self.code = code

	@property
	def subgroup(self):
		return self.code[len(self.subject.name):]

	@property		
	def teacher_code(self):
		return self.students_worksheet_rows[0][col_index('J')].value

	@property
	def students_worksheet_rows(self):
		if not hasattr(self, '_students_rows'):
			students_worksheet = get_workbook()['StudentData']
			self._students_rows = [
				row for row in students_worksheet
				if row[col_index('I')].value == self.code
			]
		return self._students_rows

	def students(self, student_model=None):
		if not hasattr(self, '_students'):
			student_code_col = col_index('D')

			def student_for_row(row):
				if student_model is None:
					return None
				student_code = row[student_code_col].value
				return student_model.objects.get(student_code=student_code)

			self._students = [
				Student(row, db_student=student_for_row(row)) 
				for row in self.students_worksheet_rows
			]
		return self._students

