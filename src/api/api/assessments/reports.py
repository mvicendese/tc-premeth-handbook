from django.db import models

from .models import (
	UnitAssessmentSchema,
	BlockAssessmentSchema,
	LessonPrelearningAssessmentSchema,
	LessonOutcomeSelfAssessmentSchema
)

def generate_default_report(assessment_set, assessment_type=None):
	return dict(
		assessment_type=assessment_type,
		count=assessment_set.count()
	)

def generate_unit_report(assessment_set):
	return generate_default_report(assessment_set, 'unit-assessment')

def generate_block_report(assessment_set):
	return generate_default_report(assessment_set, 'block-assessment')

def generate_lesson_prelearning_report(assessment_set):
	data = generate_default_report(assessment_set, 'lesson-prelearning-assessment')

	completed_set = assessment_set.filter(is_completed=True)
	data.update(completed_set.aggregate(
		students_completed_count=models.Count('id')
	))

	last_completed_assessment=completed_set.order_by('-completed_at').first()
	data.update(dict(
		most_recent_completion_at=getattr(last_completed_assessment, 'completed_at', None),
		most_recent_completion_by=getattr(last_completed_assessment, 'student', None)
	))

	data.update(completed_student_ids=[assessment.student_id for assessment in completed_set.all()])
	return data

def generate_lesson_outcome_self_assessment_report(assessment_set):
	return generate_default_report(assessment_set, 'lesson-outcome-self-assessment')

def generate_report(assessment_type, assessment_set):
	if assessment_type is None:
		return generate_default_report(assessment_set)
	elif assessment_type == 'unit-assessment':
		return generate_unit_report(assessment_set)
	elif assessment_type == 'block-assessment':
		return generate_block_report(assessment_set)
	elif assessment_type == 'lesson-prelearning-assessment':
		return generate_lesson_prelearning_report(assessment_set)
	elif assessment_type == 'lesson-outcome-self-assessment':
		return generate_lesson_outcome_self_assessment_report(assessment_set)
	else:
		raise Exception(f'No report for assessment type \'{assessment_type}\'')
