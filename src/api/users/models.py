from uuid import uuid4

from django.db import models
from django.contrib.auth.models import AbstractUser

from rest_framework.decorators import action

from ext.django.db.models import BaseModel

class Person(BaseModel):
	class Meta:
		abstract = True

	email = models.CharField(max_length=1024)
	first_name = models.CharField(max_length=128)
	surname = models.CharField(max_length=128)

	user = models.OneToOneField('users.User', null=True, on_delete=models.SET_NULL)

	@property
	def full_name(self):
		return f'{self.first_name} {self.surname}'

class AdminPerson(Person):
	pass


class User(AbstractUser):
	id = models.UUIDField(primary_key=True, default=uuid4)

	email = models.EmailField(unique=True)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	user_type = models.CharField(max_length=64)

	@property
	def person(self):
		if self.user_type not in {'teacher', 'student', 'adminperson'}:
			raise ValueError(f'Unrecognised user type: {self.user_type}')

		return getattr(self, self.user_type)

	def get_full_name(self):
		return self.person.full_name

