from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ScoreTypeViewSet,
    RoundViewSet,
    RoundScoreViewSet,
    HoleScoreViewSet
)

router = DefaultRouter()
router.register(r'score-types', ScoreTypeViewSet, basename='scoretype')
router.register(r'rounds', RoundViewSet, basename='round')
router.register(r'round-scores', RoundScoreViewSet, basename='roundscore')
router.register(r'hole-scores', HoleScoreViewSet, basename='holescore')

urlpatterns = [
    path('', include(router.urls)),
]
