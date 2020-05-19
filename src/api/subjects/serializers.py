from rest_framework import serializers

from base.serializers import BaseSerializer

from .models import Subject, Unit, Block, Lesson, LessonOutcome


class LessonOutcomeSerializer(BaseSerializer):
	subject = serializers.UUIDField(read_only=True, source='subject.id')
	name = serializers.CharField(source='description', read_only=True)

	class Meta:
		model = LessonOutcome
		model_name = 'lesson-outcome'
		fields = BaseSerializer.Meta.fields + ('lesson', 'subject', 'description', 'name')


class LessonSerializer(BaseSerializer):
	subject = serializers.UUIDField(read_only=True, source='subject.id')

	example_descriptions = serializers.ListField(child=serializers.CharField())
	block = serializers.UUIDField(read_only=True, source='block_id')
	outcomes = LessonOutcomeSerializer(source='lessonoutcome_set', many=True, read_only=True)

	class Meta:
		model = Lesson
		model_name = 'lesson'
		fields = BaseSerializer.Meta.fields + (
			'subject',
			'block',
			'code', 
			'number', 
			'name',
			'outcomes', 
			'example_descriptions'
		)

class BlockSerializer(BaseSerializer):
	subject = serializers.UUIDField(read_only=True, source='subject.id')

	
	unit = serializers.UUIDField(read_only=True, source='unit_id')
	lessons = LessonSerializer(source='lesson_set', many=True, read_only=True)

	class Meta:
		model = Block
		model_name = 'block'
		fields = BaseSerializer.Meta.fields + (
			'subject',
			'unit',
			'name', 
			'lessons'
		)


class UnitSerializer(BaseSerializer):
	
	subject = serializers.UUIDField(read_only=True, source='subject_id')
	blocks = BlockSerializer(source='block_set', many=True, read_only=True)

	class Meta:
		model = Unit
		model_name = 'unit'
		fields = BaseSerializer.Meta.fields + (
			'name', 
			'subject',
			'blocks'
		)		


class SubjectSerializer(BaseSerializer):
	units = UnitSerializer(source='unit_set', many=True, read_only=True)
	class Meta:
		model = Subject
		model_name = 'subject'
		fields = BaseSerializer.Meta.fields + ('name', 'units')
