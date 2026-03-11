from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import ScoreType, Round, RoundScore, HoleScore
from .serializers import (
    ScoreTypeSerializer,
    RoundSerializer,
    RoundListSerializer,
    RoundCreateSerializer,
    RoundUpdateSerializer,
    RoundScoreSerializer,
    HoleScoreSerializer
)


class ScoreTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ScoreType.objects.all()
    serializer_class = ScoreTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class RoundViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return RoundCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RoundUpdateSerializer
        elif self.action == 'list':
            return RoundListSerializer
        return RoundSerializer

    def create(self, request, *args, **kwargs):
        print(f"Creating round with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        # Return the created round with full details including id
        round_instance = serializer.instance
        response_serializer = RoundSerializer(round_instance)

        # Calculate and update handicap after round creation
        from apps.users.services import HandicapCalculationService
        try:
            HandicapCalculationService.update_user_handicap(request.user)
        except Exception as e:
            print(f"Error updating handicap: {e}")

        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        user = self.request.user
        queryset = Round.objects.filter(user=user).select_related(
            'course', 'course_tee', 'score_type', 'score'
        ).prefetch_related('hole_scores', 'stats')

        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        score_type = self.request.query_params.get('score_type')
        if score_type:
            queryset = queryset.filter(score_type__type=score_type)

        return queryset.order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['get'])
    def hole_scores(self, request, pk=None):
        round_instance = self.get_object()
        hole_scores = round_instance.hole_scores.all().order_by('hole__hole_number')
        serializer = HoleScoreSerializer(hole_scores, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def score(self, request, pk=None):
        round_instance = self.get_object()
        try:
            score = round_instance.score
            serializer = RoundScoreSerializer(score)
            return Response(serializer.data)
        except RoundScore.DoesNotExist:
            return Response(
                {'detail': 'Score not found for this round.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def recent(self, request):
        limit = int(request.query_params.get('limit', 10))
        rounds = self.get_queryset()[:limit]
        serializer = RoundListSerializer(rounds, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats_summary(self, request):
        rounds = self.get_queryset()

        print(f"=== STATS SUMMARY DEBUG ===")
        print(f"Total rounds in queryset: {rounds.count()}")

        if not rounds.exists():
            print("No rounds found, returning empty stats")
            return Response({
                'total_rounds': 0,
                'average_score': None,
                'best_score': None,
                'worst_score': None
            })

        total_rounds = rounds.count()

        # Use ORM filtering to get rounds with scores
        rounds_with_scores = rounds.filter(score__isnull=False)
        print(f"Rounds with scores: {rounds_with_scores.count()}")

        scores = list(rounds_with_scores.values_list('score__gross_score', flat=True))
        print(f"Scores list: {scores}")

        if scores:
            average_score = sum(scores) / len(scores)
            best_score = min(scores)
            worst_score = max(scores)
            print(f"Average: {average_score}, Best: {best_score}, Worst: {worst_score}")
        else:
            average_score = None
            best_score = None
            worst_score = None
            print("No scores found")

        response_data = {
            'total_rounds': total_rounds,
            'average_score': round(average_score, 1) if average_score else None,
            'best_score': best_score,
            'worst_score': worst_score
        }
        print(f"Response data: {response_data}")
        print("=== END STATS SUMMARY DEBUG ===")

        return Response(response_data)


class RoundScoreViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RoundScoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return RoundScore.objects.filter(round__user=user).select_related('round')


class HoleScoreViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HoleScoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = HoleScore.objects.filter(round__user=user).select_related('hole', 'round')

        round_id = self.request.query_params.get('round_id')
        if round_id:
            queryset = queryset.filter(round_id=round_id)

        return queryset.order_by('round', 'hole__hole_number')
