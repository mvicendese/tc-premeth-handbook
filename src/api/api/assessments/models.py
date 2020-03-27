from django.db import models

from api.base.models import BaseModel

from api.schools.models import School, Student
from api.subjects.models import SubjectNode, Subject, Lesson, Block, Unit, LessonOutcome


##########################################
## 
##  Assessment Attempt model definitions
##
##########################################

class AssessmentAttempt(BaseModel):
	assessment = models.ForeignKey('assessments.Assessment', on_delete=models.CASCADE)

	attempt_number = models.PositiveSmallIntegerField()
	date = models.DateTimeField()

	class Meta:
		abstract = True
		ordering = ('assessment_id', 'attempt_number')

class AttemptManager(models.Manager):
	def get_last_attempt_set(self):
		return self.filter(assessment_id=models.OuterRef('id')).order_by('-attempt_number')[:1]

	def annotate_assessment_aggregates(self, assessment_set):
		raise NotImplementedError('AssessmentSchema.AttemptQuerySet.annotate_assessment_aggregates')

class CompletedAttempt(AssessmentAttempt):
	is_completed = models.BooleanField(default=False)

	class Meta:
		abstract = True

	class CompletionBasedAttemptManager(AttemptManager):
		def annotate_attempt_aggregates(self, assessment_set):
			last_attempts = self.get_last_attempt_set()
			return assessment_set.annotate(
				is_completed=models.Subquery(last_attempts.values('is_completed')),
				completed_at=models.Subquery(last_attempts.values('date'))
			)

	objects = CompletionBasedAttemptManager()

class RatedAttempt(AssessmentAttempt):
	rating = models.PositiveSmallIntegerField(null=True)

	class Meta:
		abstract = True

	class RatedAttemptManager(AttemptManager):
		def annotate_attemp_aggregates(self, assessment_set):
			last_attempts = self.get_last_attempt_set()
			return assessment_set.annotate(
				rating=models.Subquery(last_attempts.values('rating')),
				completed_at=models.Subquery(last_attempts.values('date'))
			)

	objects = RatedAttemptManager()

class MarkedAttempt(AssessmentAttempt):
	raw_mark = models.PositiveSmallIntegerField()

	class Meta:
		abstract = True

	class MarkedAttemptManager(AttemptManager):
		def annotate_attempt_aggregates(self, assessment_set):
			last_attempts = self.get_last_attempt_set()
			return assessment_set.annotate(
				raw_mark=models.Subquery(last_attempts.values('raw_mark')),
				completed_at=models.Subquery(last_attempts.values('date'))
			)

	objects = MarkedAttemptManager()

###################################
##
## Assessment Schema definitions
##
###################################

class AssessmentSchema(BaseModel):
	school = models.ForeignKey(School, on_delete=models.CASCADE)
	node = models.ForeignKey(SubjectNode, on_delete=models.CASCADE, null=True)
	type = models.CharField(max_length=64)

	@property
	def subject(self):
		return self.node.subject()
		
class MarkedAssessmentSchema(AssessmentSchema):
	maximum_available_mark = models.PositiveSmallIntegerField()

	class Meta:
		abstract = True

class CompletedAssessmentSchema(AssessmentSchema):
	""" A completion based assessment is marked "completed" on submission """
	is_completed = models.BooleanField(default=False)

	class Meta:
		abstract = True

class RatedAssessmentSchema(AssessmentSchema):
	""" A rated assessment is assigned a value `0 <= rating < 5`"""
	rating = models.PositiveSmallIntegerField(null=True)

	class Meta:
		abstract = True


####################################
##
## Leaf assessment types
##
####################################

class UnitAssessmentAttempt(MarkedAttempt):
	pass

class UnitAssessmentSchema(MarkedAssessmentSchema):
	assessment_type 	= 'unit-assessment'
	subject_node_class 	= Unit
	attempt_class 		= UnitAssessmentAttempt

	@property
	def unit(self):
		return self.node.unit()

class BlockAssessmentAttempt(MarkedAttempt):
	pass

class BlockAssessmentSchema(MarkedAssessmentSchema):
	assessment_type = 'block-assessment'
	subject_node_class = Block
	attempt_class = BlockAssessmentAttempt

	@property
	def block(self):
		return self.node.block()

class LessonPrelearningAssessmentAttempt(CompletedAttempt):
	pass

class LessonPrelearningAssessmentSchema(CompletedAssessmentSchema):
	assessment_type = 'lesson-prelearning-assessment'
	subject_node_class = Lesson
	attempt_class = LessonPrelearningAssessmentAttempt

	@property
	def lesson(self):
		return self.node.lesson()

class LessonOutcomeSelfAssessmentAttempt(RatedAttempt):
	pass
	
class LessonOutcomeSelfAssessmentSchema(RatedAssessmentSchema):
	subject_node_class = LessonOutcome
	attempt_class = LessonOutcomeSelfAssessmentAttempt

	@property
	def lessonoutcome(self):
		return self.node.lessonoutcome()


ALL_SCHEMA_CLASSES = (
	UnitAssessmentSchema, 
	BlockAssessmentSchema,
	LessonPrelearningAssessmentSchema,
	LessonOutcomeSelfAssessmentSchema
)

def schema_class_for_type(assessment_type):
	if assessment_type is None:
		return None

	if assessment_type == 'unit-assessment':
		return UnitAssessmentSchema
	elif assessment_type == 'block-assessment':
		return BlockAssessmentSchema
	elif assessment_type == 'lesson-outcome-self-assessment':
		return LessonOutcomeSelfAssessmentSchema
	elif assessment_type == 'lesson-prelearning-assessment':
		return LessonPrelearningAssessmentSchema
	else:
		raise Exception(f'No schema class for assessment type {assessment_type}')


####################################
##
## Assessment model
##
####################################

class Assessment(BaseModel):
	student 	= models.ForeignKey(Student, on_delete=models.CASCADE)
	schema_base = models.ForeignKey(AssessmentSchema, on_delete=models.CASCADE)

	@classmethod
	def of_type(cls, assessment_type=None):
		if assessment_type is None:
			return cls.objects
		elif assessment_type == 'unit-assessment':
			return cls.unit_assessments
		elif assessment_type == 'block-assessment':
			return cls.block_assessments
		elif assessment_type == 'lesson-prelearning-assessment':
			return cls.lesson_prelearning_assessments
		elif assessment_type == 'lesson-outcome-self-assessment':
			return cls.lesson_outcome_self_assessments
		else:
			raise ValueError(f'Invalid assessment type \'{assessment_type}\'')

	@property
	def is_attempted(self):
		return self.attempt_set.empty()

	@property
	def attempt_set(self):
		schema_class = schema_class_for_type(self.type)
		attempt_class = schema_class.attempt_class
		return attempt_class.objects.filter(assessment=self)

	@property
	def schema(self):
		schema_class = schema_class_for_type(self.type)
		return getattr(self.schema_base, schema_class.__name__.lower())


	class QuerySet(models.QuerySet):
		def filter_node(self, node_id, include_descendents=False):
			"""
			Filter the assessments of the node `node_id`. 

			include_descents can either be:
				- a boolean (include all descendents)
				- a string (include all descendents of the given type)
			"""

			if include_descendents:
				nodes = SubjectNode.objects.get_descendents(id=node_id)
			else:
				nodes = SubjectNode.objects.filter(id=node_id)

			return self.filter(schema_base__node_id__in=nodes)

	class AssessmentManager(models.Manager):
		def __init__(self, assessment_type=None):
			super().__init__()
			self.assessment_type = assessment_type

		@property
		def attempt_class(self):
			return self.schema_class and self.schema_class.attempt_class

		@property
		def schema_class(self):
			return schema_class_for_type(self.assessment_type)

		def get_queryset(self):
			qs = Assessment.QuerySet(self.model, using=self._db)
			qs = qs.annotate(type=models.F('schema_base__type'))

			if self.schema_class is not None:
				qs = qs.select_related(f'schema_base__{self.schema_class.__name__.lower()}')
				qs = qs.filter(type=self.assessment_type)

				related_attempts_name = self.attempt_class.__name__.lower() + '_set'
				qs = qs.prefetch_related(related_attempts_name)
				qs = self.attempt_class.objects.annotate_attempt_aggregates(qs)

			return qs

		def filter_node(self, node_id, include_descendents=False):
			return self.get_queryset().filter_node(node_id, include_descendents)

	objects = AssessmentManager()

	unit_assessments = AssessmentManager('unit-assessment')
	block_assessments = AssessmentManager('block-assessment')
	lesson_prelearning_assessments = AssessmentManager('lesson-prelearning-assessment')
	lesson_outcome_self_assessments = AssessmentManager('lesson-outcome-self-assessment')
