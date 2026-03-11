from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet,
    CourseTeeViewSet,
    HoleViewSet,
    CourseSearchAPIView,
    CourseSaveFromAPIView
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'tees', CourseTeeViewSet, basename='coursetee')
router.register(r'holes', HoleViewSet, basename='hole')

urlpatterns = [
    path('courses/search/', CourseSearchAPIView.as_view(), name='course-search'),
    path('courses/save/', CourseSaveFromAPIView.as_view(), name='course-save'),
    path('', include(router.urls)),
]
