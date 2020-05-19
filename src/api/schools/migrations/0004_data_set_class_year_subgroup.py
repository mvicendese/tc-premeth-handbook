

from django.db import migrations

from utils import importer
from utils.importer import (
	get_premeth_subject,
	get_tc_school
)

def set_class_subgroup(apps, schema_editor):
	subject = get_premeth_subject(apps)
	school = get_tc_school(apps)

	all_students = importer.schools.Student.all(student_model=apps.get_model('schools', 'Student'))
	seen_classes = set()
	for student in all_students:
		for cls in student.db_student.subjectclass_set.exclude(id__in=seen_classes):
			cls.subgroup = student.class_code[len(cls.subject.name):]
			cls.save()	
			seen_classes.add(cls.id)	


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0003_data_import_classes')
    ]

    operations = [
    	migrations.RunPython(set_class_subgroup)
    ]
