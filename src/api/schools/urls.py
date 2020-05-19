from rest_framework.routers import SimpleRouter

from .views import TeacherViewSet, StudentViewSet, ClassViewSet

router = SimpleRouter()
router.register('teachers', TeacherViewSet)
router.register('students', StudentViewSet)
router.register('classes', ClassViewSet)

urlpatterns = router.urls
