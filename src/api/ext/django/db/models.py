import uuid
from datetime import datetime

from django.apps import apps
from django.db import models


class BaseModel(models.Model):
    """
    A model which uses uuid as primary key and has `created_at`, `updated_at` 
    fields
    """

    id = models.UUIDField(primary_key=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ObservableModel(BaseModel):
    """
    A model for which we can listen for Change events on. 

    TODO: 
        - Change tables
        - Change events 
        - A lot of stuff
    """

    version = models.PositiveIntegerField(default=1)

    deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True)

    class Meta:
        abstract = True


class Document(models.Model):
    """
    A document represents a collection of models that are aggregated in 
    some fashion to produce a document.

    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    generated_at = models.DateTimeField(null=True)
    generation   = models.PositiveIntegerField(default=1)

    class Meta:
        abstract = True


    def generate(self, **kwargs):
        self.generated_at = datetime.now()
        self.generation += 1
        return self

    @property
    def is_stale(self):
        pass

    class Manager(models.Manager):
        def get_or_generate(self, **kwargs):
            obj, is_newly_created = self.get_or_create(**kwargs)
            if is_newly_created or obj.is_stale:
                obj.generate(**kwargs)
                obj.save()
            return obj

    objects = Manager()