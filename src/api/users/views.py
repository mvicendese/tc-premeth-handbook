from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import User
from .serializers import PublicUserSerializer


class UserViewSet(ReadOnlyModelViewSet):
	queryset = User.objects.all()
	serializer_class = PublicUserSerializer

	

def register_routes(router):
	router.register('auth/users', UserViewSet)