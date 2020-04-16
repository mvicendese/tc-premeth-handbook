from uuid import uuid4

from django.db import models

class BaseModel(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid4)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		abstract = True

def model_typename(model_instance_or_class):
	import inspect

	if inspect.isclass(model_instance_or_class):
		return model_instance_or_class.__name__.lower()
	else:
		return model_type(type(model_instance_or_class))


class Document(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid4)

	generated_at = models.DateTimeField(auto_now=True)
	generation = models.PositiveSmallIntegerField(default=1)

	class Meta:	
		abstract = True

	def generate(self, **kwargs):
		self.generation += 1
		return self

	@property
	def is_stale(self):
		raise NotImplementedError('Document.stale')

	class Manager(models.Manager):
		def __init__(self, is_document):
			self.is_document
			super().__init__()

		def get_or_generate(self, **kwargs):
			obj, is_newly_created = self.get_or_create(**kwargs)
			if is_newly_created or obj.is_stale:
				obj.generate(**kwargs)
				obj.save()
			return obj

