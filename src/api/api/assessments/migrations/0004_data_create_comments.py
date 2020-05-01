from django.db import migrations, models

from utils import importer
from utils.importer import (get_premeth_subject, get_mvi_teacher)


def create_unit_assessment_comments(apps, schema_editor):
    subject = get_premeth_subject(apps)

    for unit in subject.units:
        unit_assessments = (
            importer.assessments.UnitAssessment
            .all_for_unit(unit, assessment_model=apps.get_model('assessments', 'Assessment'))
        )    
        for assessment in unit_assessments:
            if assessment.comment is not None:
                create_unit_assessment_comment(apps, assessment)


def create_unit_assessment_comment(apps, import_unit_assessment):
    ContentType = apps.get_model('contenttypes', 'ContentType')

    assessment_type = ContentType.objects.get(app_label='assessments', model='assessment')

    Comment = apps.get_model('base', 'Comment')

    teacher = get_mvi_teacher(apps).db_teacher.user

    comment = Comment(
        attached_to_type=assessment_type,
        attached_to_id=import_unit_assessment.id,
        created_by=teacher,
        content=import_unit_assessment.comment 
    ) 
    comment.save()


class Migration(migrations.Migration):

    dependencies = [
        ('assessments', '0003_data_import'),
        ('base',        '0001_initial'),
        ('schools',     '0005_data_create_users'),
        ('sessions',    '0001_initial')
    ]

    operations = [
        migrations.RunPython(create_unit_assessment_comments, lambda apps, schema_editor: None)
    ]
