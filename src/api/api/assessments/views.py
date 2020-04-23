import re

from uuid import UUID
from django.core.exceptions import ValidationError
from django.http import Http404
from django.shortcuts import render

from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from api.base.views import SaveableModelViewSet

from api.subjects.models import SubjectNode
from api.schools.models import SubjectClass, Student

from .models import (
    Assessment, 
    AssessmentSchema, 
    Progress,
    Report
)
from .serializers import AssessmentSerializer, ReportSerializer, AttemptSerializer, ProgressSerializer

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


class AssessmentViewSet(SaveableModelViewSet):
    def get_assessment_type(self):
        raw_type = self.request.query_params.get('type', None)

        if raw_type is None:
            raw_type = self.request.data.get('type', None)

        if raw_type is None and 'pk' in self.kwargs:
            assessment = Assessment._base_manager.prefetch_related('schema').get(pk=self.kwargs['pk'])
            raw_type = assessment.schema.type

        if raw_type is None:
            raise ValidationError(detail={'type': 'Request has no assessment_type'})

        return raw_type

    def get_serializer_class(self):
        return AssessmentSerializer.class_for_assessment_type(self.get_assessment_type())

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
        assessment_type = self.get_assessment_type()
        qs = Assessment.objects_of_type(assessment_type)

        student_param = self.request.query_params.get('student', None)
        if student_param is not None:
            student_ids = student_param.split(',')
            students = Student.objects.filter(id__in=student_ids)
            qs = qs.filter_students(students)

        subject_class = self.get_subject_class_from_params()
        if subject_class is not None:
            qs = qs.filter_class(subject_class)

        node = self.get_node_from_params()
        if node is not None:
            qs = qs.filter_node(node, include_descendants=True)

        return qs

    @action(detail=False)
    def reports(self, request):
        assessment_type = self.get_assessment_type()
        if assessment_type is None:
            return Response({'errors': {'type': 'Report must be run on an assessment type'}}, status=status.HTTP_400_BAD_REQUEST)

        schema = AssessmentSchema.objects.get(type=assessment_type)

        node = self.get_node_from_params()
        subject_class = self.get_subject_class_from_params()

        # A report is generated for each of the report nodes of the parameter node
        # which are of the schema's subject node type
        all_report_nodes = node.get_descendants_of_type(schema.subject_node_type)

        if not all_report_nodes.exists():
            raise ValidationError(detail={'node': f'Node has no descendants of type {schema.subject_node_type}'})

        page_nodes = self.paginate_queryset(all_report_nodes.all())

        reports = [] 
        for node in page_nodes: 
            print('generating report for', node, subject_class)
            report = schema.get_or_generate_report(subject_class=subject_class, subject_node=node)
            report.save()
            reports.append(report)

        report_serializer = ReportSerializer.for_attempt_type(schema.attempt_type, reports, many=True)
        return Response({
            'count': len(page_nodes),
            'results': report_serializer.data
         })

    @action(detail=False)
    def progress(self, request):
        assessment_type = self.get_assessment_type()
        if assessment_type is None:
            return Response({'errors': {'type': 'Progress must be run for an assessment type'}}, status=status.HTTP_400_BAD_REQUEST)

        schema = AssessmentSchema.objects.get(type=assessment_type)
        student_id = self.request.query_params.get('student', None)
        if student_id is None:
            raise ValidationError(detail={
                'student', 'Required parameter student'
            })

        student = Student.objects.get(pk=student_id)

        node = self.get_node_from_params()
        if node is None:
            # If the node is not provided, results are for the entire subject.
            node = schema.subject.node

        progress = schema.get_or_generate_progress(student=student, subject_node=node)

        progress_serializer = ProgressSerializer.for_attempt_type(schema.attempt_type, progress)
        return Response({
            'count': 1, 
            'results': [progress_serializer.data]
        })


    @action(detail=True, methods=['post'])
    def attempt(self, request, pk=None):
        assessment = self.get_object()    
        # If the object has not yet been created, then pretend we didn't find anything :)
        # TODO: Consider adding enough information into the attempt to lazily create the assessment?
        if assessment._state.adding:
            raise Http404        

        data = {'assessment': assessment.id}
        data.update(request.data)

        serializer = AttemptSerializer.for_attempt_type(assessment.schema.attempt_type, data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def register_routes(router):
    router.register('assessments', AssessmentViewSet, basename='')
