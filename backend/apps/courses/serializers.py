from rest_framework import serializers
from .models import Course, CourseTee, Hole


class HoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hole
        fields = ['id', 'hole_number', 'par', 'distance', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseTeeSerializer(serializers.ModelSerializer):
    holes = HoleSerializer(many=True, read_only=True)
    
    class Meta:
        model = CourseTee
        fields = ['id', 'name', 'slope', 'rating', 'par', 'handicap', 'holes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseSerializer(serializers.ModelSerializer):
    tees = CourseTeeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'name', 'city', 'state', 'address', 'country', 'tees', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'city', 'state', 'country']


class CourseTeeListSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = CourseTee
        fields = ['id', 'course_name', 'name', 'slope', 'rating', 'par']
