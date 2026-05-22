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
        fields = [
            'id', 'course_name', 'date', 'score_type_display', 'gross_score', 'net_score',
            'holes_played', 'hole_segment', 'stats', 'created_at'
        ]
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
            'date', 'holes_played', 'hole_segment', 'score', 'hole_scores', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_email', 'created_at', 'updated_at']


class RoundCreateSerializer(serializers.ModelSerializer):
    hole_scores = HoleScoreCreateSerializer(many=True, required=False)
    gross_score = serializers.IntegerField(required=False, allow_null=True)
    net_score = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Round
        fields = [
            'course', 'course_tee', 'score_type', 'date',
            'holes_played', 'hole_segment',
            'gross_score', 'net_score', 'hole_scores'
        ]

    def validate(self, attrs):
        score_type = attrs.get('score_type')
        hole_scores = attrs.get('hole_scores', [])
        gross_score = attrs.get('gross_score')
        net_score = attrs.get('net_score')
        holes_played = attrs.get('holes_played', 18)
        hole_segment = attrs.get('hole_segment', Round.FULL_18)

        # Validate segment/holes_played consistency
        if holes_played == 9 and hole_segment == Round.FULL_18:
            raise serializers.ValidationError(
                "hole_segment must be 'front_9' or 'back_9' when holes_played is 9"
            )
        if holes_played == 18 and hole_segment != Round.FULL_18:
            raise serializers.ValidationError(
                "hole_segment must be 'full_18' when holes_played is 18"
            )

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
            expected_count = holes_played
            if len(hole_scores) != expected_count:
                raise serializers.ValidationError(
                    f"Exactly {expected_count} hole scores are required for this round"
                )
            # Validate hole numbers match the selected segment
            if holes_played == 9:
                if hole_segment == Round.FRONT_9:
                    valid_holes = set(range(1, 10))
                else:
                    valid_holes = set(range(10, 19))
                submitted_hole_ids = {hs['hole'].hole_number for hs in hole_scores if hasattr(hs.get('hole'), 'hole_number')}
                if submitted_hole_ids and not submitted_hole_ids.issubset(valid_holes):
                    raise serializers.ValidationError(
                        f"Hole numbers must be in range {sorted(valid_holes)} for {hole_segment}"
                    )

        return attrs

    def _calculate_net_score(self, total_score, user, course_tee, hole_segment, holes_played):
        """Calculate net score using side-specific rating/slope for 9-hole rounds."""
        try:
            handicap_index = float(user.profile.handicap_index)
        except (AttributeError, TypeError):
            return total_score

        if holes_played == 9:
            if hole_segment == Round.FRONT_9:
                side_rating = float(course_tee.front_course_rating or course_tee.rating / 2)
                side_slope = float(course_tee.front_slope_rating or course_tee.slope)
                if not course_tee.front_course_rating:
                    print(f"[HANDICAP] Warning: front_course_rating missing for tee {course_tee.id}, using estimate")
            else:
                side_rating = float(course_tee.back_course_rating or course_tee.rating / 2)
                side_slope = float(course_tee.back_slope_rating or course_tee.slope)
                if not course_tee.back_course_rating:
                    print(f"[HANDICAP] Warning: back_course_rating missing for tee {course_tee.id}, using estimate")

            half_index = round(handicap_index / 2, 1)
            # Estimate 9-hole par as half of full par
            nine_hole_par = round(float(course_tee.par) / 2)
            course_handicap = round(half_index * (side_slope / 113) + (side_rating - nine_hole_par))
        else:
            course_handicap = round((handicap_index * float(course_tee.slope)) / 113)

        return total_score - int(course_handicap)

    def create(self, validated_data):
        hole_scores_data = validated_data.pop('hole_scores', [])
        gross_score = validated_data.pop('gross_score', None)
        net_score = validated_data.pop('net_score', None)

        user = self.context['request'].user
        round_instance = Round.objects.create(user=user, **validated_data)

        course_tee = round_instance.course_tee
        holes_played = round_instance.holes_played
        hole_segment = round_instance.hole_segment

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

            net_total = self._calculate_net_score(total_score, user, course_tee, hole_segment, holes_played)

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
