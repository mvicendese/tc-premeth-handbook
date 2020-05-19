
from uuid import uuid4

from django.utils import timezone
from django.db import models

from django.contrib.auth.models import User

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from ext.django.db.models import ObservableModel


class Attachable(ObservableModel):
    attached_to_type    = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    attached_to_id      = models.UUIDField()

    attached_to         = GenericForeignKey('attached_to_type', 'attached_to_id')

    created_by = models.ForeignKey('users.User', on_delete=models.CASCADE)


class Comment(Attachable):
    reply_to = models.ForeignKey('base.Comment', on_delete=models.CASCADE, null=True)

    # Markdown encoded content.
    content = models.TextField()
