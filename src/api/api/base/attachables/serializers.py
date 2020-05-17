from django.conf import settings

from rest_framework import serializers
from ext.markdown.serializer_fields import MarkdownField

from self.models import User

from .models import Comment


class AttachmentSerializer(serializers.ModelSerializer):
	attached_to_type = serializers.CharField(source='attached_to_type.model')
	attached_to = serializers.PrimaryKeyRelatedField(read_only=True)

	created_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all)

	class Meta:
		fields = (
			'id', 
			'created_at',
			'attached_to_type',
			'attached_to',
			'created_by',
			'created_at'
		)


class CommentSerializer(AttachmentSerializer):
	content = serializers.CharField()
	html_content = MarkdownField(source='content')

	class Meta:
		model = Comment
		fields = AttachmentSerializer.Meta.fields + (
			'content',
			'html_content'
		)

	def to_representation(self, instance):
		repr = {'type': 'comment'}
		repr.update(super().to_representation(instance))
		return repr
