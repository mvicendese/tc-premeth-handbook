from rest_framework import serializers
from ext.rest_framework.serializers import BaseModelSerializer

from .models import Person, User

class PersonSerializer(BaseModelSerializer):
	school = serializers.PrimaryKeyRelatedField(read_only=True)

	first_name 	= serializers.CharField()
	surname 	= serializers.CharField()
	full_name 	= serializers.CharField()
	email 		= serializers.CharField()

	class Meta:
		fields = BaseModelSerializer.Meta.fields + (
			'school',
			'first_name',
			'surname',
			'full_name',
			'email'
		)


class PersonField(serializers.Serializer):
	def to_representation(self, instance):
		from api.schools.models import Student, Teacher
		from api.schools.serializers import StudentSerializer, TeacherSerializer

		if isinstance(instance, Student):
			return StudentSerializer(instance).data
		elif isinstance(instance, Teacher):
			return TeacherSerializer(instance).data
		else:
			raise ValueError(f'Not a person: {instance}')



class PublicUserSerializer(BaseModelSerializer):
	person = PersonField()

	class Meta:
		model = User
		fields = BaseModelSerializer.Meta.fields + (
			'id',
			'person',
		)
