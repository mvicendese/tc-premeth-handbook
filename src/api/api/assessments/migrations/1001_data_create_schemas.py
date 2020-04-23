
from django.db import migrations

from api.subjects.models import SubjectNodeType
from api.assessments.models import AttemptType

from utils.importer import (
	get_tc_school,
	get_premeth_subject
)

def create_assessment_schema(apps, **kwargs):
	AssessmentSchema = apps.get_model('assessments', 'AssessmentSchema')
	return AssessmentSchema.objects.create(
		school_id=get_tc_school(apps).id,
		subject_id=get_premeth_subject(apps).id,
		**kwargs
	)
def set_assessment_option_default(apps, assessment_schema=None, **kwargs):
	AssessmentOptions = apps.get_model('assessments', 'AssessmentOptions')

	options = { 
		f'_{AttemptType(assessment_schema.attempt_type).name}_{name}': value 
		for name, value in kwargs.items()
	}
	AssessmentOptions.objects.create(
		schema=assessment_schema,
		subject_node=None,
		**options
	)

def create_unit_assessment_schema(apps):
	return create_assessment_schema(apps,
		type='unit-assessment',
		attempt_type=AttemptType.RATED,
		subject_node_type=SubjectNodeType.UNIT,
	)


def create_block_assessment_schema(apps):
	return create_assessment_schema(apps,
		type='block-assessment',
		attempt_type=AttemptType.RATED,
		subject_node_type=SubjectNodeType.BLOCK,
	)

def create_prelearning_assessment_schema(apps):
	return create_assessment_schema(apps,
		type='lesson-prelearning-assessment',
		attempt_type=AttemptType.COMPLETION_BASED,
		subject_node_type=SubjectNodeType.LESSON,	
	)

def create_lesson_outcome_self_assessment_schema(apps):
	schema = create_assessment_schema(apps,
		type='lesson-outcome-self-assessment',
		attempt_type=AttemptType.RATED,
		subject_node_type=SubjectNodeType.LESSON_OUTCOME,	
	)
	set_assessment_option_default(apps, schema, max_available_rating=4)

def create_assessment_schemas(apps, schema_editor):
	create_unit_assessment_schema(apps)
	create_block_assessment_schema(apps)
	create_prelearning_assessment_schema(apps)
	create_lesson_outcome_self_assessment_schema(apps)
	
class Migration(migrations.Migration):

    dependencies = [
        ('assessments', '0002_auto_20200421_1151'),
        ('subjects', 	'0009_data_prepopulate_subject_tree'),
        ('schools', 	'0002_data_import_teachers_students'),
    ]

    operations = [
    	migrations.RunPython(create_assessment_schemas)
    ]