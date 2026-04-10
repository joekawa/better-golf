from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Course, CourseTee, Hole
from .serializers import (
    CourseSerializer,
    CourseListSerializer,
    CourseTeeSerializer,
    CourseTeeListSerializer,
    HoleSerializer
)
from .services import GolfCourseAPIService


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        return CourseSerializer

    def get_queryset(self):
        queryset = Course.objects.all()

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                name__icontains=search
            ) | queryset.filter(
                city__icontains=search
            ) | queryset.filter(
                state__icontains=search
            )

        return queryset.order_by('name')

    @action(detail=True, methods=['get'])
    def tees(self, request, pk=None):
        course = self.get_object()
        tees = course.tees.all()
        serializer = CourseTeeSerializer(tees, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def holes(self, request, pk=None):
        course = self.get_object()
        tee_id = request.query_params.get('tee_id')

        if tee_id:
            holes = course.holes.filter(course_tee_id=tee_id)
        else:
            holes = course.holes.all()

        serializer = HoleSerializer(holes, many=True)
        return Response(serializer.data)


class CourseTeeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CourseTee.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseTeeListSerializer
        return CourseTeeSerializer

    def get_queryset(self):
        queryset = CourseTee.objects.select_related('course').all()

        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return queryset.order_by('course__name', 'name')


class HoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hole.objects.all()
    serializer_class = HoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Hole.objects.select_related('course', 'course_tee').all()

        course_id = self.request.query_params.get('course_id')
        tee_id = self.request.query_params.get('tee_id')

        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if tee_id:
            queryset = queryset.filter(course_tee_id=tee_id)

        return queryset.order_by('hole_number')


class CourseSearchAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')

        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service = GolfCourseAPIService()
        data = service.search_courses(query)

        return Response({
            'source': data.get('source'),
            'count': len(data.get('results', [])),
            'results': data.get('results', []),
            'fallback_reason': data.get('fallback_reason'),
            'api_status_code': data.get('api_status_code'),
            'message': data.get('message'),
        })


class CourseSaveFromAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')

        if not course_id:
            return Response(
                {'error': 'course_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service = GolfCourseAPIService()
        course_data = service.get_course_details(course_id)

        if not course_data:
            return Response(
                {'error': 'Course not found or API error'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            course = service.save_course_to_db(course_data)
            serializer = CourseSerializer(course)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Error saving course: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
