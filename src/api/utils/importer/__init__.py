
from . import schools
from . import subjects
from . import assessments

_apps = None

_tc_school 			= None
_mvi_teacher 		= None
_eraw_teacher 		= None
_premeth_subject 	= None

def reset_cached_if_apps_changed(apps):
	global _apps, _tc_school, _mvi_teacher, _eraw_teacher, _premeth_subject

	if apps != _apps:
		_apps = apps
		_tc_school 			= None
		_mvi_teacher 		= None
		_eraw_teacher 	 	= None
		_premeth_subject 	= None

def get_tc_school(apps):
	reset_cached_if_apps_changed(apps)
	global _tc_school
	if _tc_school is None:
		school_model = apps.get_model('schools', 'School')
		_tc_school = schools.School.tc_school(school_model=school_model)
	return _tc_school

def create_tc_school(apps, school_model):
	global _tc_school
	db_school = school_model.objects.get_or_create(
		name='Templestowe')

def get_mvi_teacher(apps):
	reset_cached_if_apps_changed(apps)
	global _mvi_teacher
	if _mvi_teacher is None:
		teacher_model = apps.get_model('schools', 'Teacher')
		_mvi_teacher = schools.Teacher.mvi_teacher(teacher_model=teacher_model)
	return _mvi_teacher

def get_eraw_teacher(apps):
	reset_cached_if_apps_changed(apps)
	global _eraw_teacher
	if _eraw_teacher is None:
		teacher_model = apps.get_model('schools', 'Teacher')
		_eraw_teacher = schools.Teadcher.eraw_teacher(teacher_model=teacher_model)
	return _eraw_teacher

def get_premeth_subject(apps):
	reset_cached_if_apps_changed(apps)
	global _premeth_subject
	if _eraw_teacher is None:
		subject_model = apps.get_model('subjects', 'Subject')
		_premeth_subject = subjects.Subject.premeth_subject(subject_model=subject_model)
	return _premeth_subject