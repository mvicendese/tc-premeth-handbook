from collections import OrderedDict

from rest_framework import serializers


class BaseModelSerializer(serializers.ModelSerializer):
	def to_representation(self, instance):
		obj = OrderedDict(type=type(self).Meta.model.__name__.lower())
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
