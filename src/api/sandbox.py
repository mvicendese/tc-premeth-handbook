

from api.assessments.models import Assessment
from api.assessments.serializers import AssessmentSerializer

prelearn = Assessment.lesson_prelearning_assessments.first()
serializer = AssessmentSerializer(prelearn)

serializer.to_representation(prelearn)