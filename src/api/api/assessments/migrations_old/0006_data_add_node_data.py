

from django.db import migrations, models
import django.db.models.deletion


def add_subject_node_data(apps, schema_editor):
	Assessment = apps.get_model('assessments', 'Assessment')

	print('ASSESSMENT', Assessment)	

	for a in Assessment.unit_assessments.all():
		a.schema.node = a.schema.unit.node
		a.save()

	for a in Assessment.block_assessments.all():
		a.schema.node = a.schema.block.node
		a.save()

	for a in Assessment.lesson_prelearning_assessments.all():
		a.schema.node = a.schema.lesson.node
		a.save()

	for a in Assessment.lesson_outcome_self_assessment.all():
		a.schema.node = a.schema.lessonoutcome.node
		a.save()


class Migration(migrations.Migration):

    dependencies = [
        ('assessments', '0005_auto_20200327_0032'),
        ('subjects', 	'0005_data_populate_subject_tree'),
    ]

    operations = [
    	migrations.RunPython(add_subject_node_data)
    ]
