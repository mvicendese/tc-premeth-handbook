from django.db import migrations, models
from django.contrib.auth.hashers import make_password
import django.db.models.deletion

from utils import importer
from utils.importer import get_teachers


def create_users_for_teachers(apps, schema_editor):
	User = apps.get_model('self', 'User')

	teachers = get_teachers(apps)

	for teacher in teachers:
		user = User.objects.create(
			username=teacher.email,
			password=make_password('temp')
		)
		teacher.db_teacher.user = user
		teacher.db_teacher.save()

def create_users_for_students(apps, schema_editor):
	User = apps.get_model('self', 'User')
	students = importer.schools.Student.all(student_model=apps.get_model('schools', 'Student'))

	for student in students:
		user = User.objects.create(
			username=student.email,
			password=make_password('temp')
		)
		student.db_student.user = user
		student.db_student.save()

class Migration(migrations.Migration):

	dependencies = [
		('schools', '0004_data_set_class_year_subgroup'),
		('self', '0002_auto_20200428_1853')
	]

	operations = [
		migrations.RunPython(create_users_for_teachers),
		migrations.RunPython(create_users_for_students)
	]