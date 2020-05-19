from django.db import models
from django.contrib.auth.models import User

from ext.django.db.models import BaseModel

from self.models import Person

from api.subjects.models import Subject



class School(BaseModel):
	name = models.CharField(max_length=1024)

class SchoolPerson(Person):
	school = models.ForeignKey(School, on_delete=models.CASCADE)

	class Meta:
		abstract = True

class Student(SchoolPerson):
	student_code = models.CharField(max_length=16)
	year_level = models.PositiveSmallIntegerField()
	compass_number = models.PositiveSmallIntegerField()

class Teacher(SchoolPerson):
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


