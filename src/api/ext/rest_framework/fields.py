from django.db import models

from django.contrib.contenttypes.models import ContentType
from rest_framework.serializers import RelatedField


class RefField(RelatedField):

	def get_queryset(self):
		raise NotImplementedError('get_queryset')

	def to_representation(self, value):
		content_type = ContentType.objects.get_for_model(value)
		return {
			'type': f'{content_type.app_label}.{content_type.model}',
			'id': value.id
		}

	def to_internal_value(self, data):
		if isinstance(data, models.Model):
			return data

		type = data.get('type', None)
		if type is None or not re.match(r'^[a-z]+\.[-a-z]+$'):
			raise ValidationError(detail={'type': 'A type is required'})
		app_label, type_name = type.split('.')

		try:
			content_type = ContentType.objects.get_by_natural_key(app_label, type_name)
		except ContentType.DoesNotExist:
			raise ValidationError(detail={'type': 'The specified type does not exist'})

		id = data.get('id', None)
		if id is None:
			raise ValidationError(detail={'id': 'An id is required'})

		try:
			return content_type.model_class()._base_manager.get(pk=id)
		except ObjectDoesNotExist:
			raise ValidationError(detail={'id': 'The object does not exist'})







