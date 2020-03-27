from api.assessments.models import Assessment, LessonPrelearningAssessmentAttempt
from api.assessments.reports import generate_lesson_prelearning_report

node_id = "74734210-a801-4926-85ac-d5dccef17444"

prelearning_assessments = Assessment.lesson_prelearning_assessments.filter_node(node_id)

print(f'Got {prelearning_assessments.count()} prelearning assessments')


annotated = LessonPrelearningAssessmentAttempt.objects.annotate_attempt_aggregates(prelearning_assessments)
