from uuid import uuid4, UUID

from django.db import models

from api.base.models import BaseModel

from api.schools.models import School, Student, SubjectClass
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
	def get_last_attempt_set(self, assessment_id_ref=None):
		return self.filter(assessment_id=assessment_id_ref).order_by('-attempt_number')[:1]

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
		def annotate_attempt_aggregates(self, assessment_set):
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
			last_attempts = self.get_last_attempt_set(outer_id=models.OuterRef('id'))
			return assessment_set.annotate(
				raw_mark=models.Subquery(last_attempts.values('raw_mark')),
				completed_at=models.Subquery(last_attempts.values('date'))
			)

	objects = MarkedAttemptManager()

###############################
## 
## Assessment Reports
##
###############################

class AssessmentReport(BaseModel):
	schema 		 	= models.ForeignKey('AssessmentSchema', on_delete=models.CASCADE)

	# The class group of students for which this report was generated.
	# Null if generated against all students
	subject_class 	= models.ForeignKey(SubjectClass, null=True, on_delete=models.CASCADE)
	generated_at 	= models.DateTimeField(auto_now_add=True)

	total_candidate_count = models.IntegerField()
	attempted_candidate_count = models.IntegerField()

	_not_attempted_ids = models.TextField()

	class Meta:
		abstract = True

	@property	
	def assessment_type(self):
		return self.schema.type

	@property
	def not_attempted_candidate_ids(self):
		if self._not_attempted_ids == '':
			return set()
		return set(UUID(hex=id) for id in self._not_attempted_ids.split(':'))

	@property
	def percent_attempted(self):
		return 100 * (self.attempted_candidate_count / self.total_candidate_count)

	@not_attempted_candidate_ids.setter
	def not_attempted_candidate_ids(self, ids):
		self._not_attempted_ids = ':'.join(id.hex for id in ids)

	@property
	def assessment_set(self):
		assessments = (
			Assessment
			.objects_of_type(self.schema.type)
			.filter(schema_base=self.schema))

		if self.subject_class is not None:
			assessments = assessments.filter_class(self.subject_class)
		return assessments

class AssessmentReportManager(models.Manager):
	def generate(self, schema, subject_class=None):
		"""
		Generates a report containing significant aggregates the given assessment set
		depending on the assessment type.

		A subject class can be provided in order to restrict the students which 
		are considered candidates for this report
		"""	
		if not hasattr(type(schema), 'report_class'):
			raise NotImplementedError(f'Assessment schema class {type(schema)} has no \'report_class\'')

		report = type(schema).report_class(
			id=uuid4(),
			schema=schema, 
			subject_class=subject_class
		)

		candidates = schema.candidate_set
		if subject_class is not None:
			candidates = candidates.filter(subjectclass=subject_class)

		report.total_candidate_count = candidates.count()

		assessments = report.assessment_set
		report.attempted_candidate_count = assessments.count()

		non_attempt_candidates = candidates.exclude(id__in=assessments.values('student_id'))
		report.not_attempted_ids = [student.id for student in non_attempt_candidates.all()]

		return report

class MarkedAssessmentReport(AssessmentReport):
	pass

class CompletedReport(AssessmentReport):
	completed_candidate_count = models.IntegerField()

	most_recent_completion_at = models.DateTimeField(null=True)

	_completed_candidate_ids = models.TextField(default='')

	class Meta:
		abstract = True

	class CompletedReportManager(AssessmentReportManager):
		def generate(self, schema, subject_class=None):
			report = super().generate(schema, subject_class=subject_class)

			assessments = report.assessment_set
			completed_set = assessments.filter(is_completed=True).order_by('-completed_at')
			report.completed_candidate_count=completed_set.count()

			most_recent_completion=completed_set.first()
			if most_recent_completion:
				report.most_recent_completion_at = most_recent_completion.completed_at

			return report

	objects = CompletedReportManager()

	@property
	def completed_candiate_ids(self):
		if self._compelted_ids == '':
			return set()
		return set(UUID(hex=id) for id in self._completed_ids.split(':'))

	@completed_candiate_ids.setter
	def completed_candidate_ids(self, ids):
		self._completed_candidate_ids = ':'.join(id.hex for id in ids)

	@property
	def percent_complete(self):
		return 100 * (self.total_candiate_count / self.completed_candidate_count)

class RatedAssessmentReport(AssessmentReport):
	pass

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

	@property
	def candidate_set(self):
		return Student.objects.filter(school=self.school)

	def generate_report(self, subject_class=None):
		return type(self).report_class.objects.generate(self, subject_class)


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


class UnitAssessmentReport(MarkedAssessmentReport):
	pass


class UnitAssessmentSchema(MarkedAssessmentSchema):
	assessment_type 	= 'unit-assessment'
	subject_node_class 	= Unit
	attempt_class 		= UnitAssessmentAttempt
	report_class		= UnitAssessmentReport

	@property
	def unit(self):
		return self.node.unit()

class BlockAssessmentAttempt(MarkedAttempt):
	pass

class BlockAssessmentReport(MarkedAssessmentReport):
	pass

class BlockAssessmentSchema(MarkedAssessmentSchema):
	assessment_type = 'block-assessment'
	pass_node_class = Block
	attempt_class = BlockAssessmentAttempt
	report_class  = BlockAssessmentReport

	@property
	def block(self):
		return self.node.block()

class LessonPrelearningAssessmentAttempt(CompletedAttempt):
	pass

class LessonPrelearningAssessmentReport(CompletedReport):
	pass

class LessonPrelearningAssessmentSchema(CompletedAssessmentSchema):
	assessment_type 	= 'lesson-prelearning-assessment'
	subject_node_class 	= Lesson
	attempt_class 		= LessonPrelearningAssessmentAttempt
	report_class  		= LessonPrelearningAssessmentReport

	@property
	def lesson(self):
		return self.node.lesson()

class LessonOutcomeSelfAssessmentAttempt(RatedAttempt):
	pass

class LessonOutcomeSelfAssessmentReport(RatedAssessmentReport):
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
		ACCEPT_PARAMS = (
			'node',
			'class',
			'student',
			'type'	
		)

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

		def filter_node(self, subject_node, include_descendents=False):
			if include_descendents:
				## TODO: This shouldn't be difficult
				raise NotImplementedError('Can only select node exactly')

			return self.filter(schema_base__node=subject_node)

		def filter_class(self, subject_class):
			return self.filter(student__in=subject_class.students.all())

		def filter_student(self, student_id):
			return self.filter(student_id=student_id)

		def filter_type(self, assessment_type):
			return self.filter(type=assessment_type)

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
			if self.assessment_type:
				qs = qs.filter_type(self.assessment_type)

				qs = qs.select_related(f'schema_base__{self.schema_class.__name__.lower()}')

				related_attempts_name = self.attempt_class.__name__.lower() + '_set'
				qs = qs.prefetch_related(related_attempts_name)
				qs = self.attempt_class.objects.annotate_attempt_aggregates(qs)

			return qs

		def generate_report(self, schema, subject_class=None):
			return schema.generate_report(subject_class=subject_class)

		def filter_node(self, subject_node, include_descendents=False):
			return self.get_queryset().filter_node(subject_node, include_descendents)

		def filter_class(self, subject_class):
			return self.get_queryset().filter_class(subject_class)

	objects = AssessmentManager()

	unit_assessments = AssessmentManager('unit-assessment')
	block_assessments = AssessmentManager('block-assessment')
	lesson_prelearning_assessments = AssessmentManager('lesson-prelearning-assessment')
	lesson_outcome_self_assessments = AssessmentManager('lesson-outcome-self-assessment')

	@classmethod
	def objects_of_type(cls, assessment_type):
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
			raise ValueError(f'Invalid assessment type {assessment_type}')
