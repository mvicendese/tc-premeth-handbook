from django.conf import settings
import markdown

from rest_framework import serializers


class MarkdownField(serializers.Serializer):
	def __init__(self, *args, **kwargs):
		self.markdown = markdown.Markdown(**settings.MARKDOWN)
		super().__init__(*args, **kwargs)

	def to_representation(self, value):
		return self.markdown.convert(value)