
from uuid import uuid4

from django.utils import timezone
from django.db import models

from django.contrib.auth.models import User

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Attachable(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)

    attached_to_type    = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    attached_to_id      = models.UUIDField()

    attached_to         = GenericForeignKey('attached_to_type', 'attached_to_type')

    created_by = models.ForeignKey('self.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    deleted    = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True)

class Comment(Attachable):
    reply_to = models.ForeignKey('base.Comment', on_delete=models.CASCADE, null=True)

    # Markdown encoded content.
    content = models.TextField()
