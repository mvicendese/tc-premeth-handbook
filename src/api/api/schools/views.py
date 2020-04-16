from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework import viewsets

from api.assessments.models import Assessment, AssessmentType, Progress
from api.assessments.serializers import ProgressSerializer

# Create your views here.
from .models import Student, Teacher, SubjectClass
from .serializers import StudentSerializer, TeacherSerializer, SubjectClassSerializer

class StudentViewSet(viewsets.ModelViewSet):
	queryset = Student.objects.all()
	serializer_class = StudentSerializer

	def get_queryset(self):
		qs = super().get_queryset()

		resolve_ids = self.request.query_params.getlist('resolve')	
		if resolve_ids:
			return qs.filter(id__in=resolve_ids)

		return qs

	@action(detail=True)
	def progress(self, request):
		student = self.get_object()

		assessment_type = request.query_params.get('type', None)
		if assessment_type is None:
			raise ValidationError(detail={'type': 'Unrecognised assessment type'})

		qs = Assessment.objects.of_type(assessment_type)

		subject_node = request.query_params.get('node', None)
		if subject_node is not None:
			qs = qs.filter_node(include_descendents=True)

		progress = Progress.objects_of_type(assessment_type).get_or_generate(
			student, 
			subject_node=subject_node,
			assessments=qs
		)

		serializer = ProgressSerializer.for_assessment_type(assessment_type, progress)
		return serializer.data

class TeacherViewSet(viewsets.ModelViewSet):
	queryset = Teacher.objects.all()
	serializer_class = TeacherSerializer

class ClassViewSet(viewsets.ModelViewSet):	
	queryset = SubjectClass.objects.order_by('-year', 'subgroup')
	serializer_class = SubjectClassSerializer
