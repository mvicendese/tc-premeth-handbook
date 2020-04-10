from django.core.exceptions import ObjectDoesNotExist

from rest_framework import mixins, viewsets 



class SaveableModelViewSet(mixins.UpdateModelMixin,
                           viewsets.ReadOnlyModelViewSet):
    """

    Updating performs the role of both `create` and `update` in a standard ModelViewSet

    UUIDs are unique and random, so the user can generate them instead of the server with
    statistically zero probability of collision.

    Since no allocation of an 'id' resources is required, object creation is thus idempotent for 
    these models.

    """


    def get_object(self):
        # Reimplement get_object, except return an unsaved object
        # if the target does not exist.
        queryset = self.filter_queryset(self.get_queryset())

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        assert lookup_url_kwarg in self.kwargs, (
            'Expected view %s to be called with a URL keyword argument '
            'named "%s". Fix your URL conf, or set the `.lookup_field` '
            'attribute on the view correctly.' %
            (self.__class__.__name__, lookup_url_kwarg)
        )

        model_id = self.kwargs[lookup_url_kwarg]

        filter_kwargs = { self.lookup_field: model_id }
        queryset = queryset.filter(**filter_kwargs)

        try:
            obj = queryset.get()
        except ObjectDoesNotExist as e:
            # Create a new object with the requested id.
            obj = queryset.model(id=model_id)

        self.check_object_permissions(self.request, obj)
        return obj





