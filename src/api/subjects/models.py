from functools import reduce

from django.utils.translation import gettext_lazy as _
from django.db import models
from django.core.exceptions import ObjectDoesNotExist

from treebeard.mp_tree import MP_Node

from ext.django.db.models import BaseModel
from api.base.models import model_typename

class SubjectNodeType(models.TextChoices):
    SUBJECT             = 'subject',             _('Subject')
    UNIT                   = 'unit',                 _('Unit')
    BLOCK                  = 'block',                 _('Block')
    LESSON                 = 'lesson',             _('Lesson')
    LESSON_OUTCOME         = 'lesson-outcome',     _('LessonOutcome')


class SubjectNodeTypeField(models.CharField):
    def __init__(self, *args, **kwargs):
        if 'max_length' in kwargs:
            raise KeyError('max_length is an invalid argument for SubjectNodeTypeField')
        if 'choices' in kwargs:
            raise KeyError('choices is an invalid argument for SubjectNodeTypeField')
        kwargs.update(
            max_length=32,
            choices=SubjectNodeType.choices
        )
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs = dict(kwargs)

        kwargs.pop('max_length', None)
        kwargs.pop('choices', None)
        return name, path, args, kwargs

class SubjectNode(MP_Node):
    id = models.UUIDField(primary_key=True)
    node_type = SubjectNodeTypeField()

    @classmethod
    def add_subject(cls, subject):
        subject_node = cls.add_root(id=subject.id, node_type=SubjectNodeType.SUBJECT)
        for unit in subject.unit_set.all():    
            unit_node = cls._add_unit_to_subject(subject_node, unit)
        return subject_node

    @classmethod
    def _add_unit_to_subject(cls, subject_node, unit):
        unit_node = subject_node.add_child(id=unit.id, node_type=SubjectNodeType.UNIT)
        for block in unit_node.unit().block_set.all():
            block_node = cls._add_block_to_unit(unit_node, block)
        return unit_node

    @classmethod
    def _add_block_to_unit(cls, unit_node, block):
        block_node = unit_node.add_child(id=block.id, node_type=SubjectNodeType.BLOCK)
        for lesson in block_node.block().lesson_set.all():
            lesson_node = cls._add_lesson_to_block(block_node, lesson)
        return block_node

    @classmethod
    def _add_lesson_to_block(cls, block_node, lesson):
        lesson_node = block_node.add_child(id=lesson.id, node_type=SubjectNodeType.LESSON)
        for lessonoutcome in lesson_node.lesson().lessonoutcome_set.all():
            lessonoutcome_node = cls._add_lessonoutcome_to_lesson(lesson_node, lessonoutcome)
        return lesson_node

    @classmethod
    def _add_lessonoutcome_to_lesson(cls, lesson_node, lessonoutcome):
        return lesson_node.add_child(id=lessonoutcome.id, node_type=SubjectNodeType.LESSON_OUTCOME)

    def subject(self):
        if self.node_type == 'subject':
            return Subject.objects.get(pk=self.id)
        elif self.node_type in ['unit', 'block', 'lesson', 'lesson-outcome']:
            return self.get_ancestors().filter(node_type='subject').get().subject()
        else:
            return None

    def unit(self):
        if self.node_type == 'unit':
            return Unit.objects.get(pk=self.id)
        elif self.node_type in ['block', 'lesson', 'lesson-outcome']:
            return self.get_ancestors().get(node_type='unit').unit()
        else:
            return None

    def block(self):
        if self.node_type == 'block':
            return Block.objects.get(pk=self.id)
        elif self.node_type in ['lesson', 'lesson-outcome']:
            return self.get_ancestors().filter(node_type='block').get().block()
        else:
            return None

    def lesson(self):
        if self.node_type == 'lesson':
            return Lesson.objects.get(pk=self.id)
        elif self.node_type in ['lesson-outcome']:
            return self.get_ancestors().filter(node_type='lesson').get().lesson()
        else:
            return None

    def lessonoutcome(self):
        if self.node_type == 'lesson-outcome':
            return LessonOutcome.objects.get(pk=self.id)
        else:
            return None

    def get_descendants_of_type(self, subject_node_type):
        if subject_node_type == self.node_type:
            return SubjectNode.objects.filter(pk__in=[self.id])

        return (
            self.get_descendants()
            .filter(node_type=subject_node_type)
        )


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
                self._node = SubjectNode.objects.get(pk=self.id)
            return self._node

        @property
        def subject(self):
            if not hasattr(self, '_subject'):
                self._subject = Subject.objects.get(id=self.node.get_root().id)
            return self._subject


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

