from django.shortcuts import render

from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.subjects.models import SubjectNode
from api.schools.models import SubjectClass

from .models import Assessment, schema_class_for_type
from .serializers import AssessmentSerializer, ReportSerializer

# Create your views here.

def filter_student_params(assessment_set, query_params):
	student_param = self.request.query_params.get('student', None)
	if student_param is not None:
		qs = qs.filter(student_id=student_param)			

	class_param = self.request.query_params.get('class', None)
	if class_param is not None:
		subject_class = SubjectClass.objects.get(id=class_param)
		qs = qs.filter(student_id__in=subject_class.students.get_queryset())

	return qs


class AssessmentViewSet(viewsets.ReadOnlyModelViewSet):
	queryset 			= Assessment.objects.all()
	serializer_class 	= AssessmentSerializer

	@property
	def assessment_type(self):
		return self.request.query_params.get('type', None)

	def get_node_from_params(self):
		node_param = self.request.query_params.get('node', None)
		if node_param is None:
			return None
		else:
			try:
				return SubjectNode.objects.get(id=node_param)
			except SubjectNode.DoesNotExist: 
				return Response.invalid({node: 'Node does not exist'})

	def get_subject_class_from_params(self):
		class_param = self.request.query_params.get('class', None)
		if class_param is None:
			return None
		else:
			subject_class = SubjectClass.objects.get(id=class_param)
			return subject_class

	def get_queryset(self):
		qs = super().get_queryset()
		if self.assessment_type is not None:
			qs = qs.filter_type(self.assessment_type)

		student_param = self.request.query_params.get('student', None)
		if student_param is not None:
			qs = qs.filter(student_id=student_param)

		subject_class = self.get_subject_class_from_params()
		if subject_class is not None:
			qs = qs.filter_class(subject_class)

		node = self.get_node_from_params()
		if node is not None:
			qs &= Assessment.objects.filter_node(node)

		return qs

	@action(detail=False)
	def report(self, request):
		if self.assessment_type is None:
			return Response.invalid({'type': 'Report must be run on an assessment type'})

		node = self.get_node_from_params()
		if node is None:
			return Response.invalid({'node': 'Report must be run on a node'})

		try:
			assessments = Assessment.objects_of_type(self.assessment_type)
		except ValueError as err:
			return Response.invalid({ 'type': err.message })

		schema = assessments.schema_class.objects.get(node=node)
		subject_class = self.get_subject_class_from_params()

		report = assessments.generate_report(schema, subject_class)
		report.save()

		report_serializer = ReportSerializer(report)
		return Response({
			'count': 1,
			'results': [report_serializer.data]
		})


def register_routes(router):
	router.register('assessments', AssessmentViewSet)
