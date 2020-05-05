from uuid import uuid4, UUID
from datetime import datetime

from django.db import models
from django.apps import apps

from .attachables.models import *

def model_typename(model_instance_or_class):
    import inspect

    if inspect.isclass(model_instance_or_class):
        return model_instance_or_class.__name__.lower()
    else:
        return model_type(type(model_instance_or_class))


# This takes two fields and returns the percentage ratio of the first attribute to the second
# If the second value is `0`, returns `0`
def calculated_percentage_property(partial_attr, total_attr):
    def get_value(self):
        total_value = getattr(self, total_attr)
        if total_value == 0:
            return 0
        return (100 * getattr(self, partial_attr)) / total_value
    return property(get_value)


def comma_delimited_model_count_property(attr):
    def count(self):
        attr_value = getattr(self, attr)
        return len(attr_value.split(',')) if attr_value else 0
    return property(count)

def comma_delimited_models_property(model, attr):
    def load_model():
        nonlocal model
        if isinstance(model, str):
            model = apps.get_model(model)
        return model

    def get_list(self):
        model = load_model()
        text_value = getattr(self, attr)
        return model._base_manager.filter(
            pk__in=[UUID(hex=id) for id in text_value.split(',')] if text_value else []
        )

    def set_list(self, values):
        model = load_model()
        values = [
            value.id if isinstance(value, model) else value
            for value in values
        ]
        text_value = ','.join(value.hex for value in values)
        setattr(self, attr, text_value)

    return property(get_list, set_list)
