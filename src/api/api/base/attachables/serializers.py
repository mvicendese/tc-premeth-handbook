from django.conf import settings

from rest_framework import serializers
from ext.markdown.serializer_fields import MarkdownField

from .models import Comment


class AttachableSerializer(serializers.ModelSerializer):
	class Meta:
		fields = ('id', )


class CommentSerializer(AttachableSerializer):
	content = serializers.CharField()
	html_content = MarkdownField(source='content')

	class Meta:
		model = Comment
		fields = AttachableSerializer.Meta.fields + (
			'content',
			'html_content'
		)