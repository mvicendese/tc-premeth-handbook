from functools import reduce

from django.db import models
from django.core.exceptions import ObjectDoesNotExist

from treebeard.mp_tree import MP_Node

from api.base.models import BaseModel, model_typename


class SubjectNode(MP_Node):
	id = models.UUIDField(primary_key=True)
	node_type = models.CharField(max_length=32)

	@classmethod
	def add_subject(cls, subject):
		subject_node = cls.add_root(id=subject.id, node_type='subject')
		for unit in subject.unit_set.all():	
			unit_node = cls._add_unit_to_subject(subject_node, unit)
		return subject_node

	@classmethod
	def _add_unit_to_subject(cls, subject_node, unit):
		unit_node = subject_node.add_child(id=unit.id, node_type='unit')
		for block in unit_node.unit().block_set.all():
			block_node = cls._add_block_to_unit(unit_node, block)
		return unit_node

	@classmethod
	def _add_block_to_unit(cls, unit_node, block):
		block_node = unit_node.add_child(id=block.id, node_type='block')
		for lesson in block_node.block().lesson_set.all():
			lesson_node = cls._add_lesson_to_block(block_node, lesson)
		return block_node

	@classmethod
	def _add_lesson_to_block(cls, block_node, lesson):
		lesson_node = block_node.add_child(id=lesson.id, node_type='lesson')
		for lessonoutcome in lesson_node.lesson().lessonoutcome_set.all():
			lessonoutcome_node = cls._add_lessonoutcome_to_lesson(lesson_node, lessonoutcome)
		return lesson_node

	@classmethod
	def _add_lessonoutcome_to_lesson(cls, lesson_node, lessonoutcome):
		return lesson_node.add_child(id=lessonoutcome.id, node_type='lessonoutcome')

	def subject(self):
		if self.node_type == 'subject':
			return Subject.objects.get(pk=self.id)
		else:
			return self.get_ancestors().filter(node_type='subject', id=self.id).get().unit()

	def unit(self):
		if self.node_type == 'unit':
			return Unit.objects.get(pk=self.id)
		else:
			return self.get_ancestors().filter(node_type='unit', id=self.id).get().unit()

	def block(self):
		if self.node_type == 'block':
			return Block.objects.get(pk=self.id)
		else:
			return self.get_ancestors().filter(node_type='block', id=self.id).get().unit()

	def lesson(self):
		if self.node_type == 'lesson':
			return Lesson.objects.get(pk=self.id)
		else:
			return self.get_ancestors().filter(node_type='lesson', pk=self.id).get().unit()

	class LinkedManager(models.Manager):
		"""
		Manage a model connected to a subject node
		"""
		@property
		def node_type(self):
			return model_typename(self.model)

		def get_queryset(self):
			nodes = SubjectNode.objects.filter(
				node_type=self.node_type,
				id=models.OuterRef('id')
			)

			return (
				super()
				.get_queryset()
				.annotate(node_id=models.Subquery(nodes.values('id')[:1]))
			)

		def get_node(subject_node):	
			return self.get(id=subject_node.id)

	class LinkedModel(BaseModel):
		class Meta:
			abstract = True

		@property
		def node(self):
			if not hasattr(self, '_node'):
				self._node = SubjectNode.objects.get(pk=self.node_id)
			return self._node


class Subject(SubjectNode.LinkedModel):
	name = models.CharField(max_length=256)

	objects = SubjectNode.LinkedManager()

class Unit(SubjectNode.LinkedModel):
	subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
	name = models.CharField(max_length=256)

	objects = SubjectNode.LinkedManager()

class Block(SubjectNode.LinkedModel):
	name = models.CharField(max_length=256)
	unit = models.ForeignKey(Unit, on_delete=models.CASCADE)

	objects = SubjectNode.LinkedManager()

class Lesson(SubjectNode.LinkedModel):
	code = models.CharField(max_length=2)
	name = models.CharField(max_length=256)
	number = models.IntegerField()
	block = models.ForeignKey(Block, on_delete=models.CASCADE)

	objects = SubjectNode.LinkedManager()

	@property
	def example_descriptions(self):
		return [example.description for example in self.lessonexample_set.only('description').all()]

class LessonExample(SubjectNode.LinkedModel):
	lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
	description = models.TextField()

class LessonOutcome(SubjectNode.LinkedModel):
	lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
	description = models.TextField()

	objects = SubjectNode.LinkedManager()

ALL_SUBJECT_NODE_CLASSES = (Subject, Unit, Block, Lesson, LessonOutcome)

def subject_node_is_ancestor_model(node_cls, test_parent):
	return (node_cls == test_parent
			or subject_node_is_strict_ancestor_model(node_cls, test_parent))

def subject_node_is_strict_ancestor_model(node_cls, test_parent):
	return test_parent in subject_node_strict_ancestor_models(node_cls)


def subject_node_descendent_models(node_cls):
	node_index = ALL_SUBJECT_NODE_CLASSES.index(node_cls)
	return ALL_SUBJECT_NODE_CLASSES[node_index:]

def subject_node_strict_ancestor_models(node_cls):
	node_index = ALL_SUBJECT_NODE_CLASSES.index(node_cls)
	return ALL_SUBJECT_NODE_CLASSES[:node_index]
	

class SubjectNodeQuerySet(models.QuerySet):
	def annotate_subject(self):
		if self.model == Unit:
			# Unit is directly related to subject anyway
			return self
		subject_fk = 'id'
		for node_cls in subject_node_strict_ancestor_classes(self.model):
			subject_fk = model_name()
		return self.annotate(subject_id=models.F(subject_fk))

	def get_node(self, node_id):
		for cls in subject_node_descendent_classes(self.model):
			if cls.objects.exists(id=node_id):
				return cls.objects.get(id=node_id)
		else:
			raise SubjectNodeDoesNotExist()

class SubjectNodeDoesNotExist(ObjectDoesNotExist):
	pass

