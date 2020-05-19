from rest_framework import serializers

from base.serializers import BaseSerializer
from users.serializers import PersonSerializer

from .models import Student, Teacher, SubjectClass


class TeacherSerializer(PersonSerializer):
	class Meta:
		model = Teacher
		model_name = 'teacher'

		fields = PersonSerializer.Meta.fields + (
			'teacher_code',
		)

class StudentSerializer(BaseSerializer):
	class Meta:
		model = Student
		model_name = 'student'
		fields = PersonSerializer.Meta.fields + (
			'student_code',
			'compass_number',
			'year_level'
		)

class SubjectClassSerializer(BaseSerializer):
	subject = serializers.UUIDField(source='subject.id')

	teacher = TeacherSerializer(read_only=True)
	students = StudentSerializer(many=True, read_only=True)

	class_code = serializers.CharField(read_only=True)

	class Meta:
		model = SubjectClass
		model_name = 'class'
		fields = BaseSerializer.Meta.fields + (
			'subject', 
			'teacher', 
			'students', 
			'year', 
			'subgroup', 
			'class_code'
		)



