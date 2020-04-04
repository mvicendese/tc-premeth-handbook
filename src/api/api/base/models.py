from uuid import uuid4

from django.db import models

class BaseModel(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid4)

	class Meta:
		abstract = True

def model_typename(model_instance_or_class):
	import inspect

	if inspect.isclass(model_instance_or_class):
		return model_instance_or_class.__name__.lower()
	else:
		return model_type(type(model_instance_or_class))
