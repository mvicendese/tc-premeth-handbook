from django.conf import settings

from rest_framework import serializers

import markdown

from .models import Comment

class MarkdownField(serializers.Serializer):
	def __init__(self, *args, **kwargs):
		self.markdown = markdown.Markdown(**settings.MARKDOWN)
		super().__init__(*args, **kwargs)

	def to_representation(self, value):
		return self.markdown.convert(value)

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