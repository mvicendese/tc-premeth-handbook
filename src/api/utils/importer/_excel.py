import openpyxl

from django.conf import settings

from functools import reduce

_workbook = None

def get_workbook():
	global _workbook
	if _workbook is None:
		workbook_file = getattr(settings, 'SOURCE_WORKBOOK', None)
		if workbook_file is None:
			raise Error('Invalid settings. A value for SOURCE_WORKBOOK must be configured')	

		_workbook = openpyxl.load_workbook(workbook_file, read_only=True, data_only=True)

	return _workbook

def col_index(col_letter):
	all_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	if len(col_letter) == 1:
		return all_letters.index(col_letter)
	else:
		# 'AA', 'AB', ..., 'ZZ', 'AAA', ... etc.
		indexes = [col_index(letter) for letter in col_letter]
		total_index = -1
		for index in indexes:
			total_index += 1
			total_index *= len(all_letters)
			total_index += index
		return total_index

