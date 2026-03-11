from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Stats
from .serializers import (
    StatsSerializer,
    StatsCreateSerializer,
    StatsUpdateSerializer,
    StatsAggregateSerializer,
    ScoreTrendSerializer,
    CourseStatisticsSerializer
)
from .services import StatsCalculationService


class StatsViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return StatsCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StatsUpdateSerializer
        return StatsSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Stats.objects.filter(round__user=user).select_related(
            'round', 'round__course', 'round__score'
        )

        round_id = self.request.query_params.get('round_id')
        if round_id:
            queryset = queryset.filter(round_id=round_id)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(round__date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(round__date__lte=date_to)

        return queryset.order_by('-round__date')

    def perform_create(self, serializer):
        round_instance = serializer.validated_data['round']
        if round_instance.user != self.request.user:
            raise PermissionError("You can only create stats for your own rounds")

        if Stats.objects.filter(round=round_instance).exists():
            raise ValueError("Stats already exist for this round")

        serializer.save()

    @action(detail=False, methods=['get'])
    def aggregate(self, request):
        """
        Get aggregate statistics for the user
        """
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        limit = request.query_params.get('limit')
        if limit:
            limit = int(limit)

        service = StatsCalculationService()
        aggregate_stats = service.get_user_aggregate_stats(
            request.user,
            date_from=date_from,
            date_to=date_to,
            limit=limit
        )

        serializer = StatsAggregateSerializer(aggregate_stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def trends(self, request):
        """
        Get performance trends over recent rounds
        """
        limit = int(request.query_params.get('limit', 10))

        service = StatsCalculationService()
        trends = service.get_performance_trends(request.user, limit=limit)

        return Response(trends)

    @action(detail=False, methods=['get'])
    def score_trends(self, request):
        """
        Get score trends over recent rounds
        """
        limit = request.query_params.get('limit')
        if limit:
            limit = int(limit)
        else:
            limit = 10

        service = StatsCalculationService()
        trends = service.get_score_trends(request.user, limit=limit)

        serializer = ScoreTrendSerializer(trends, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def course_statistics(self, request):
        """
        Get course-related statistics
        """
        limit = request.query_params.get('limit')
        if limit:
            limit = int(limit)

        service = StatsCalculationService()
        course_stats = service.get_course_statistics(request.user, limit=limit)

        serializer = CourseStatisticsSerializer(course_stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def best(self, request):
        """
        Get user's best statistics
        """
        service = StatsCalculationService()
        best_stats = service.get_best_stats(request.user)

        if not best_stats:
            return Response(
                {'detail': 'No statistics found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(best_stats)

    @action(detail=False, methods=['post'])
    def calculate_from_round(self, request):
        """
        Calculate statistics from a round's hole scores
        """
        from apps.rounds.models import Round

        round_id = request.data.get('round_id')
        if not round_id:
            return Response(
                {'error': 'round_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            round_instance = Round.objects.get(id=round_id, user=request.user)
        except Round.DoesNotExist:
            return Response(
                {'error': 'Round not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if Stats.objects.filter(round=round_instance).exists():
            return Response(
                {'error': 'Stats already exist for this round'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service = StatsCalculationService()
        calculated_stats = service.calculate_stats_from_hole_scores(round_instance)

        if not calculated_stats:
            return Response(
                {'error': 'No hole scores found for this round'},
                status=status.HTTP_400_BAD_REQUEST
            )

        stats = Stats.objects.create(
            round=round_instance,
            fairways_hit=calculated_stats['fairways_hit'],
            greens_in_regulation=calculated_stats['greens_in_regulation'],
            total_putts=calculated_stats['total_putts'],
            eagles=calculated_stats['eagles'],
            birdies=calculated_stats['birdies'],
            pars=calculated_stats['pars'],
            bogeys=calculated_stats['bogeys'],
            double_bogeys=calculated_stats['double_bogeys']
        )

        serializer = StatsSerializer(stats)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
