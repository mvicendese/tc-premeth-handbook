from django.conf import settings

from rest_framework import serializers

from ext.rest_framework.fields import RefField
from ext.markdown.serializer_fields import MarkdownField

from users.models import User

from .models import Comment


class AttachmentSerializer(serializers.ModelSerializer):

	attached_to = RefField()
	created_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

	class Meta:
		fields = (
			'id', 
			'created_at',
			'attached_to',
			'created_by',
			'created_at'
		)

	def create(self, validated_data):
		attached_to = validated_data.get('attached_to')


class CommentSerializer(AttachmentSerializer):
	content = serializers.CharField()
	html_content = MarkdownField(source='content', read_only=True)

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
