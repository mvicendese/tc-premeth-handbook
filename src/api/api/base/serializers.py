from collections import OrderedDict
from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
	@property
	def name(self):
		raise error(f'not implemented: {type(self)}.type')

	def to_representation(self, instance):
		obj = OrderedDict(type=type(self).Meta.model_name)
		obj.update(super().to_representation(instance))
		return obj

	class Meta:
		fields = ('id', )
