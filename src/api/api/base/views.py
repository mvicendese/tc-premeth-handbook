from django.core.exceptions import ObjectDoesNotExist

from rest_framework import mixins, viewsets 



class SaveableModelViewSet(mixins.CreateModelMixin,
                           mixins.UpdateModelMixin,
                           viewsets.ReadOnlyModelViewSet):
    """

    Updating performs the role of both `create` and `update` in a standard ModelViewSet

    UUIDs are unique and random, so the user can generate them instead of the server with
    statistically zero probability of collision.

    Since no allocation of an 'id' resources is required, object creation is thus idempotent for 
    these models.

    """

    def update(self, request, *args, **kwargs):
        """
        If the requested ID does not exist, run create with the same arguments.

        This probably should be done in the router as we're still exposing a POST / method.
        Meh. This is less code and it works.
        """

        queryset = self.get_queryset()
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        if not queryset.filter(pk=self.kwargs[lookup_url_kwarg]).exists():
            return self.create(request, *args, **kwargs)

        return super().update(request, *args, **kwargs)






