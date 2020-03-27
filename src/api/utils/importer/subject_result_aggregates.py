from collections import OrderedDict
from itertools import groupby

from subjects import Subject
from classes import Class

SUBJECT = Subject('PreMeth')

class SubjectResultAggregate():
	def __init__(self, subject, year=2020):
		self.subject = subject
		self.year = year

	@property
	def units(self):	
		if not hasattr(self, '_units'):
			self._units = OrderedDict([unit.id, UnitResultAggregate(self, unit)] for unit in self.subject.units)
		return self._units

class UnitResultAggregate():
	def __init__(self, subject_results, unit):
		self.subject_results = subject_results
		self.unit = unit

	@property
	def average_test_result(self):
		pass	

	@property
	def class_average_test_results(self):
		return dict([cls.id, self._class_average_result(cls)] for cls in Class.all())


	def _class_average_result(self, cls):
		return 0	

	@property
	def blocks(self):
		return 



class BlockResultAggregate():
	def __init__(self, unit_results, block):
		self.unit_results = unit_results
		self.block = block

	@property
	def average_test_results(self):
		pass

	@property
	def class_average_test_result(self):
		if not hasattr(self, '_class_average_test_result'):
			self._class_average_test_result = dict([cls.id, self._class_average_result(cls)] for cls in Class.all())

	def _class_average_result(self, cls):
		ws = get_workbook()['MiniAssessResults']

		student_key_col = col_index('A')
		unit_name_col = col_index('F')
		block_key_col = col_index('B')
		mark_percent_col = col_index('K')

		is_test_result_row = lambda row: all([
			row[unit_name_col].value == self.unit.name,
			row[block_key_col].value == self.block.block_key
		])

		result_rows = list(groupby(
			(row for row in ws if is_test_result_row(row)), 
			lambda row: row[student_key_col].value
		))

		def max_student_attempt(student_attempt_rows):
			return max(
				attempt[mark_percent_col].value for attempt in student_attempt_rows
			)	

		total = sum(
			max_student_attempt(student_attempts) for (student, attempts) in result_rows
		)
		return total / len(result_rows)






