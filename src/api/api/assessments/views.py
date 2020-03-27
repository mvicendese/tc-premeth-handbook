from django.shortcuts import render

from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.schools.models import SubjectClass

from .models import Assessment
from .serializers import AssessmentSerializer, ReportSerializer
from .reports import generate_report

# Create your views here.

def filter_student_params(assessment_set, query_params):
	student_param = self.request.query_params.get('student', None)
	if student_param is not None:
		qs = qs.filter(student_id=student_param)			

	class_param = self.request.query_params.get('class', None)
	if class_param is not None:
		subjectClass = SubjectClass.objects.get(id=class_param)
		qs = qs.filter(student_id__in=subjectClass.students.get_queryset())

	return qs


class AssessmentViewSet(viewsets.ReadOnlyModelViewSet):
	queryset 			= Assessment.objects.all()
	serializer_class 	= AssessmentSerializer

	def get_queryset(self):
		qs = Assessment.of_type(self.assessment_type).get_queryset()

		student_param = self.request.query_params.get('student', None)
		if student_param is not None:
			qs = qs.filter(student_id=student_param)			

		class_param = self.request.query_params.get('class', None)
		if class_param is not None:
			subjectClass = SubjectClass.objects.get(id=class_param)
			qs = qs.filter(student_id__in=subjectClass.students.get_queryset())

		node_param = self.request.query_params.get('node', None)
		if node_param is not None:
			qs &= Assessment.objects.filter_node(node_param)

		return qs

	@property
	def assessment_type(self):
		return self.request.query_params.get('type', None)

	@action(detail=False)
	def report(self, request):
		self.request = request

		assessment_type = request.query_params.get('type', None)
		report = generate_report(self.assessment_type, self.get_queryset())
		report_serializer = ReportSerializer(report)

		return Response({
			'count': 1,
			'results': [report_serializer.data]
		})


def register_routes(router):
	router.register('assessments', AssessmentViewSet)
