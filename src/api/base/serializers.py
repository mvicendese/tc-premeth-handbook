from django.conf import settings

from collections import OrderedDict
from rest_framework import serializers

from markdown import Markdown

from .attachables.serializers import *

class BaseSerializer(serializers.ModelSerializer):
	@property
	def name(self):
		raise error(f'not implemented: {type(self)}.type')

	def to_representation(self, instance):
		obj = OrderedDict(type=type(self).Meta.model_name)
		obj.update(super().to_representation(instance))
		return obj

	class Meta:
		fields = ('id', 'created_at', 'updated_at')
		

class DocumentSerializer(serializers.Serializer):
	id = serializers.UUIDField()

	generation   = serializers.IntegerField()
	generated_at = serializers.DateTimeField()

	class Meta:
		fields = ('id', 'generation', 'generated_at')

