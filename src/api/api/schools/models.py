from django.db import models
from django.contrib.auth.models import User

from api.base.models import BaseModel
from api.subjects.models import Subject



class School(BaseModel):
	name = models.CharField(max_length=1024)

class Person(BaseModel):
	class Meta:
		abstract = True

	school = models.ForeignKey(School, on_delete=models.CASCADE)

	email = models.CharField(max_length=1024)
	first_name = models.CharField(max_length=128)
	surname = models.CharField(max_length=128)

	user = models.OneToOneField('self.User', null=True, on_delete=models.SET_NULL)

	@property
	def full_name(self):
		return f'{self.first_name} {self.surname}'

class Student(Person):
	student_code = models.CharField(max_length=16)
	year_level = models.PositiveSmallIntegerField()
	compass_number = models.PositiveSmallIntegerField()

class Teacher(Person):
	teacher_code = models.CharField(max_length=16)


class SubjectClass(BaseModel):
	school = models.ForeignKey(School, on_delete=models.CASCADE)

	subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
	teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)

	students = models.ManyToManyField(Student)

	year = models.IntegerField()
	subgroup = models.CharField(max_length=16)

	class Meta:
		indexes = [
			models.Index(fields=('-year', 'subject_id', 'subgroup'))
		]

	@property
	def class_code(self):
		return self.subject.name + self.subgroup


