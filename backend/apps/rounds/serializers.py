from rest_framework import serializers
from .models import ScoreType, Round, RoundScore, HoleScore
from apps.courses.serializers import CourseListSerializer, CourseTeeListSerializer, HoleSerializer
from apps.stats.models import Stats


class ScoreTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoreType
        fields = ['id', 'type', 'created_at']
        read_only_fields = ['id', 'created_at']


class HoleScoreSerializer(serializers.ModelSerializer):
    hole_number = serializers.IntegerField(source='hole.hole_number', read_only=True)
    par = serializers.IntegerField(source='hole.par', read_only=True)

    class Meta:
        model = HoleScore
        fields = ['id', 'hole', 'hole_number', 'par', 'score', 'putts', 'fairway_hit', 'gir', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class HoleScoreCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HoleScore
        fields = ['hole', 'score', 'putts', 'fairway_hit', 'gir']


class RoundScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundScore
        fields = ['id', 'net_score', 'gross_score', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class StatsListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stats
        fields = ['eagles', 'birdies', 'pars', 'bogeys', 'double_bogeys', 'fairways_hit', 'greens_in_regulation', 'total_putts']
        read_only_fields = fields


class RoundListSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    score_type_display = serializers.CharField(source='score_type.get_type_display', read_only=True)
    gross_score = serializers.IntegerField(source='score.gross_score', read_only=True, allow_null=True)
    net_score = serializers.IntegerField(source='score.net_score', read_only=True, allow_null=True)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Round
        fields = ['id', 'course_name', 'date', 'score_type_display', 'gross_score', 'net_score', 'stats', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_stats(self, obj):
        stats_obj = obj.stats.first()
        if stats_obj:
            return StatsListSerializer(stats_obj).data
        return None


class RoundSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    course_tee = CourseTeeListSerializer(read_only=True)
    score_type = ScoreTypeSerializer(read_only=True)
    score = RoundScoreSerializer(read_only=True)
    hole_scores = HoleScoreSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Round
        fields = [
            'id', 'user_email', 'course', 'course_tee', 'score_type',
            'date', 'score', 'hole_scores', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_email', 'created_at', 'updated_at']


class RoundCreateSerializer(serializers.ModelSerializer):
    hole_scores = HoleScoreCreateSerializer(many=True, required=False)
    gross_score = serializers.IntegerField(required=False, allow_null=True)
    net_score = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Round
        fields = ['course', 'course_tee', 'score_type', 'date', 'gross_score', 'net_score', 'hole_scores']

    def validate(self, attrs):
        score_type = attrs.get('score_type')
        hole_scores = attrs.get('hole_scores', [])
        gross_score = attrs.get('gross_score')
        net_score = attrs.get('net_score')

        if score_type.type == ScoreType.TOTAL:
            if not gross_score or not net_score:
                raise serializers.ValidationError(
                    "gross_score and net_score are required for Total Score type"
                )
            if hole_scores:
                raise serializers.ValidationError(
                    "hole_scores should not be provided for Total Score type"
                )

        elif score_type.type == ScoreType.HOLE_BY_HOLE:
            if not hole_scores:
                raise serializers.ValidationError(
                    "hole_scores are required for Hole-by-Hole score type"
                )
            if len(hole_scores) != 18:
                raise serializers.ValidationError(
                    "Exactly 18 hole scores are required for Hole-by-Hole scoring"
                )

        return attrs

    def create(self, validated_data):
        hole_scores_data = validated_data.pop('hole_scores', [])
        gross_score = validated_data.pop('gross_score', None)
        net_score = validated_data.pop('net_score', None)

        user = self.context['request'].user
        round_instance = Round.objects.create(user=user, **validated_data)

        if validated_data['score_type'].type == ScoreType.TOTAL:
            RoundScore.objects.create(
                round=round_instance,
                gross_score=gross_score,
                net_score=net_score
            )

        elif validated_data['score_type'].type == ScoreType.HOLE_BY_HOLE:
            total_score = 0
            for hole_score_data in hole_scores_data:
                HoleScore.objects.create(
                    round=round_instance,
                    **hole_score_data
                )
                total_score += hole_score_data['score']

            user_handicap = user.profile.handicap_index
            course_tee = validated_data['course_tee']

            course_handicap = (user_handicap * course_tee.slope) / 113
            net_total = total_score - int(course_handicap)

            RoundScore.objects.create(
                round=round_instance,
                gross_score=total_score,
                net_score=net_total
            )

        return round_instance


class RoundUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ['date']
