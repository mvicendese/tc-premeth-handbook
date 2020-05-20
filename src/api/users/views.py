from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import User
from .serializers import PublicUserSerializer, PrivateUserSerializer


class UserViewSet(ReadOnlyModelViewSet):
	queryset = User.objects.all()
	serializer_class = PublicUserSerializer

	@action('self', detail=False, permission_classes=[IsAuthenticated])
	def detail_self(self):
		"""
		A special view which returns the user object representing the current user.
		"""
		serializer = PrivateUserSerializer(request.user())
		return Response(serializer.data)



def register_routes(router):
	router.register('auth/users', UserViewSet)