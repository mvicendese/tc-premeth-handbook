from rest_framework.routers import SimpleRouter
from .views import AssessmentViewSet

router = SimpleRouter()
router.register('', AssessmentViewSet, basename='')

urlpatterns = router.urls