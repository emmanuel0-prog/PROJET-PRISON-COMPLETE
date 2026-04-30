from rest_framework.routers import DefaultRouter
from .views import EmpreinteViewSet, FaceViewSet

router = DefaultRouter()
router.register("empreintes", EmpreinteViewSet)
router.register("faces", FaceViewSet)

urlpatterns = router.urls
