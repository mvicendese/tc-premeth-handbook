
from rest_framework import viewsets
from rest_framework.decorators import action

from .models import Subject
from .serializers import SubjectSerializer

class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = Subject.objects.order_by('-name').all()
	serializer_class = SubjectSerializer

