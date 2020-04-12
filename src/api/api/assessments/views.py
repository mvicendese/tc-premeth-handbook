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
    AssessmentType, 
    Report
)
from .serializers import AssessmentSerializer, ReportSerializer, AttemptSerializer

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
    queryset             = Assessment.objects.all()

    def get_assessment_type(self):
        raw_type = self.request.query_params.get('type', None)

        if raw_type is None and 'pk' in self.kwargs:
            try:
                assessment = Assessment.objects.get(pk=self.kwargs['pk'])
                return assessment.type
            except Assessment.DoesNotExist:
                raw_type = self.request.data.get('type', '')
                if re.search(r'-attempt', raw_type):
                    raw_type = raw_type[:-len('-attempt')]
                if re.search(r'-report', raw_type):
                    raw_type = raw_type[:-len('-report')]


        if raw_type not in AssessmentType.values:
            import pdb; pdb.set_trace()
            raise ValidationError(detail={'type': 'Unrecognised assessment type.'})
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

    def update(self, *args, **kwargs):
        return super().update(*args, **kwargs)


    def get_subject_class_from_params(self):
        class_param = self.request.query_params.get('class', None)
        if class_param is None:
            return None
        else:
            subject_class = SubjectClass.objects.get(id=class_param)
            return subject_class

    def get_queryset(self):
        qs = super().get_queryset()
        assessment_type = self.get_assessment_type()
        if assessment_type is not None:
            qs = qs.filter_type(assessment_type)

        node = self.get_node_from_params()
        if node is not None:
            qs = qs.filter_node(node, include_descendents=True)

        student_param = self.request.query_params.get('student', None)
        if student_param is not None:
            student_ids = student_param.split('|')
            students = Student.objects.filter(id__in=student_ids)
            qs = qs.filter_students(students)

        subject_class = self.get_subject_class_from_params()
        if subject_class is not None:
            qs = qs.filter_class(subject_class)

        return qs

    @action(detail=False)
    def reports(self, request):
        assessment_type = self.get_assessment_type()
        if assessment_type is None:
            return Response({'errors': {'type': 'Report must be run on an assessment type'}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            schemas = AssessmentSchema.objects_of_type(assessment_type)
        except ValueError as e:
            return Response(errors={'type': e.message}, status=status.HTTP_400_BAD_REQUEST)

        node = self.get_node_from_params()
        if node is not None:
            schemas = schemas.filter_node(node, include_descendents=True)
            if not schemas.exists():
                return Response(
                    {
                        'errors': {'node': f'Node must be a parent node for at least one schema of type \'{assessment_type}\''}
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        subject_class = self.get_subject_class_from_params()

        schema_page = self.paginate_queryset(schemas.all())

        reports = [] 
        for assessment_schema in schema_page: 
            report = assessment_schema.get_or_generate_report(subject_class=subject_class)
            reports.append(report)

        report_serializer = ReportSerializer.for_assessment_type(assessment_type, reports, many=True)
        return Response({
            'count': len(schema_page),
            'results': report_serializer.data
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

        serializer = AttemptSerializer.for_assessment_type(assessment.type, data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def register_routes(router):
    router.register('assessments', AssessmentViewSet)
