from django.contrib import admin
from .models import Course, CourseTee, Hole


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'state', 'country', 'created_at']
    list_filter = ['state', 'country']
    search_fields = ['name', 'city', 'state']


@admin.register(CourseTee)
class CourseTeeAdmin(admin.ModelAdmin):
    list_display = ['course', 'name', 'slope', 'rating', 'par', 'created_at']
    list_filter = ['course']
    search_fields = ['course__name', 'name']


@admin.register(Hole)
class HoleAdmin(admin.ModelAdmin):
    list_display = ['course', 'course_tee', 'hole_number', 'par', 'distance', 'created_at']
    list_filter = ['course', 'course_tee']
    search_fields = ['course__name']
    ordering = ['course', 'course_tee', 'hole_number']
