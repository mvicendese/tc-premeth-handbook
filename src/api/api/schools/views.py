from rest_framework.decorators import action
from rest_framework import viewsets

# Create your views here.
from .models import Student, Teacher, SubjectClass
from .serializers import StudentSerializer, TeacherSerializer, SubjectClassSerializer

class StudentViewSet(viewsets.ModelViewSet):
	queryset = Student.objects.all()
	serializer_class = StudentSerializer

	def get_queryset(self):
		qs = super().get_queryset()

		resolve_ids = self.request.query_params.getlist('resolve')	
		print('RESOLVE PARAM', resolve_ids)
		if resolve_ids:
			return qs.filter(id__in=resolve_ids)

		return qs

class TeacherViewSet(viewsets.ModelViewSet):
	queryset = Teacher.objects.all()
	serializer_class = TeacherSerializer

class ClassViewSet(viewsets.ModelViewSet):	
	queryset = SubjectClass.objects.order_by('-year', 'subgroup')
	serializer_class = SubjectClassSerializer
