
from rest_framework.routers import SimpleRouter

from .views import SubjectViewSet

router = SimpleRouter()
router.register('', SubjectViewSet)


urlpatterns = router.urls