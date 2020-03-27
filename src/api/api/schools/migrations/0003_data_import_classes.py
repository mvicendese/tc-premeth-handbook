from django.db import migrations

from utils import importer
from utils.importer import (
	get_premeth_subject,
	get_tc_school
)

def get_teacher(apps, code):
	Teacher = apps.get_model('schools', 'Teacher')
	return Teacher.objects.get(teacher_code=code)

def create_classes(apps, schema_editor):
	SubjectClass = apps.get_model('schools', 'SubjectClass')
	Student = apps.get_model('schools', 'Student')

	tc_school = get_tc_school(apps)
	premeth_subject = get_premeth_subject(apps)

	all_import_classes = list(importer.schools.Class.all(subject=premeth_subject))

	SubjectClass.objects.bulk_create(
		SubjectClass(
			id=import_cls.id,
			school_id=tc_school.id,
			subject_id=premeth_subject.id,
			teacher_id=get_teacher(apps, import_cls.teacher_code).id,
		)
		for import_cls in all_import_classes
	)

	for import_cls in all_import_classes:
		cls = SubjectClass.objects.get(id=import_cls.id)
		import_students = import_cls.students(student_model=Student)
		for import_student in import_students:
			student = Student.objects.get(id=import_student.id)
			cls.students.add(student)		
		cls.save()		


class Migration(migrations.Migration):

    dependencies = [
        ('subjects', '0002_data_import_subjects'),
        ('schools',  '0002_data_import_teachers_students')
    ]

    operations = [
    	migrations.RunPython(create_classes)
    ]
