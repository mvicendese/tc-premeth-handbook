# Export relevant information from excel file into model json


import os, sys
import getopt
import openpyxl

from django.core.exceptions import ObjectDoesNotExist
from uuid import uuid4
from collections import OrderedDict

from ._excel import get_workbook, col_index
	
class Subject():
	@classmethod
	def premeth_subject(cls, subject_model=None):
		db_subject = subject_model and subject_model.objects.get(name='PreMeth')
		return cls('PreMeth', db_subject=db_subject)


	@classmethod
	def all(cls, subject_model=None):
		return [
			cls.premeth_subject(subject_model=subject_model)
		]
		
	def __init__(self, name, db_subject=None):
		self.id = db_subject.id if db_subject else uuid4()
		self.db_subject = db_subject
		self.name = 'PreMeth'

	@property
	def units(self):
		if not hasattr(self, '_units'):
			lessons_worksheet = get_workbook()['Lessons']
			# Use the keys of an OrderedDict to emulate an ordered set
			unit_names = OrderedDict(
				[row[col_index('E')].value, None] 
				for row in list(lessons_worksheet)[1:]
				if row[col_index('E')].value is not None
			).keys()

			def unit_for_name(name):
				return self.db_subject and self.db_subject.unit_set.get(name=name)
			self._units = [Unit(self, name, db_unit=unit_for_name(name)) for name in unit_names]
		return self._units

class Unit():	
	def __init__(self, subject, name, db_unit=None):
		self.id = db_unit.id if db_unit else uuid4()
		self.db_unit = db_unit

		self.subject = subject
		self.name = name

	@property
	def lessons_rows(self):
		if not hasattr(self, '_rows'):
			lessons_worksheet = get_workbook()['Lessons']
			self._rows = [row for row in lessons_worksheet if row[col_index('E')].value == self.name]
		return self._rows		

	@property
	def key(self):
		return self.lessons_rows[0][col_index('C')].value

	@property
	def blocks(self):
		if not hasattr(self, '_blocks'):
			# Use the keys of an OrderedDict as an OrderedSet
			block_names = OrderedDict([row[col_index('F')].value, None] for row in self.lessons_rows).keys()
			def block_for_name(name):	
				return self.db_unit and self.db_unit.block_set.get(name=name)
			self._blocks = [Block(self, name, db_block=block_for_name(name)) for name in block_names]
		return self._blocks

class Block():
	def __init__(self, unit, name, db_block=None):
		self.id = db_block.id if db_block else uuid4()
		self.db_block = db_block
		self.unit = unit
		self.name = name

	@property	
	def block_key(self):
		if not hasattr(self, '_block_key'):
			self._block_key = self.lessons_rows[0][col_index('D')].value
		return self._block_key

	@property		
	def lessons_rows(self):
		if not hasattr(self, '_rows'):
			lessons_worksheet = get_workbook()['Lessons']
			self._rows = [row for row in lessons_worksheet if row[col_index('F')].value == self.name]
		return self._rows

	@property		
	def lessons(self):
		if not hasattr(self, '_lessons'):
			lesson_key_col = col_index('A')
			name_col = col_index('J')

			def lesson_for_name(name):
				if not self.db_block:
					return None
				match_lessons = self.db_block.lesson_set.extra(where=["%s LIKE '%%'||name"], params=[name])
				if match_lessons:
					match = sorted(match_lessons, key=lambda m: len(m.name), reverse=True)[0]
					return match
				else:
					raise IndexError('At least one match should be returned')

			self._lessons = [
				Lesson(self, row[lesson_key_col].value, db_lesson=lesson_for_name(row[name_col].value))
				for row in self.lessons_rows
			]
		return self._lessons	


class Lesson():	
	def __init__(self, block, lesson_key, db_lesson=None):
		self.id = db_lesson.id if db_lesson else uuid4()
		self.db_lesson = db_lesson

		self.block = block
		self.lesson_key = lesson_key

	@property		
	def lesson_row(self):
		if not hasattr(self, '_row'):
			lesson_worksheet = get_workbook()['Lessons']
			self._row = [
		 		row for row in lesson_worksheet 
		 		if row[col_index('A')].value == self.lesson_key
		 	][0]
		return self._row 	

	@property
	def lessons_row_key(self):
		if not hasattr(self, '_lessons_row_key'):
			self._lessons_row_key = self.lesson_row[col_index('A')].value
		return self._lessons_row_key

	@property		
	def name(self):
		raw_name = self.lesson_row[col_index('J')].value
		if raw_name.startswith(self.code):
			return raw_name[len(self.code):].lstrip()
		else:
			return raw_name

	@property
	def code(self):
		if not hasattr(self, '_code'):	
			self._code = self.lesson_row[col_index('I')].value
		return self._code		

	@property
	def number(self):
		return self.lesson_row[col_index('G')].value

	@property		
	def example_descriptions(self):
		raw_description = self.lesson_row[col_index('K')].value
		if raw_description is None:
			return []
		return [example.strip() for example in raw_description.split(',')]

	@property
	def outcomes(self):		
		if not hasattr(self, '_outcomes'):
			ican_worksheet = get_workbook()['Ican']
			ican_keys = OrderedDict(
				[row[col_index('A')].value, row]
				for row in ican_worksheet
				if row[col_index('C')].value == self.lesson_key
			)

			statement_col = col_index('J')

			def lesson_outcome_for_ican_key(ican_key):
				row = ican_keys[ican_key]
				try:
					return self.db_lesson and self.db_lesson.lessonoutcome_set.get(description=row[statement_col].value)
				except:
					import pdb; pdb.set_trace()


			self._outcomes = [
				LessonOutcome(self, ican_key, db_lesson_outcome=lesson_outcome_for_ican_key(ican_key))
				for ican_key, row in ican_keys.items()
			]
		return self._outcomes			

class LessonOutcome():
	def __init__(self, lesson, ican_key, db_lesson_outcome=None):
		self.id = db_lesson_outcome.id if db_lesson_outcome else uuid4()
		self.db_lesson_outcome = db_lesson_outcome

		self.lesson = lesson
		self.ican_key = ican_key

	@property	
	def ican_row(self):
		if not hasattr(self, '_row'):
			ican_worksheet = get_workbook()['Ican']	
			self._row = [row for row in ican_worksheet if row[col_index('A')].value == self.ican_key][0]
		return self._row		

	@property
	def description(self):
		return self.ican_row[col_index('J')].value
