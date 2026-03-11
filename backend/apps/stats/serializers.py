from rest_framework import serializers
from .models import Stats
from apps.rounds.serializers import RoundListSerializer


class StatsSerializer(serializers.ModelSerializer):
    round_info = RoundListSerializer(source='round', read_only=True)
    fairway_percentage = serializers.SerializerMethodField()
    gir_percentage = serializers.SerializerMethodField()
    putts_per_hole = serializers.SerializerMethodField()
    scoring_average = serializers.SerializerMethodField()

    class Meta:
        model = Stats
        fields = [
            'id', 'round', 'round_info', 'fairways_hit', 'greens_in_regulation',
            'total_putts', 'eagles', 'birdies', 'pars', 'bogeys', 'double_bogeys',
            'fairway_percentage', 'gir_percentage', 'putts_per_hole', 'scoring_average',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_fairway_percentage(self, obj):
        if obj.fairways_hit == 0:
            return 0.0

        total_holes = obj.round.hole_scores.count()
        if total_holes == 0:
            total_holes = 18

        par_3_count = obj.round.hole_scores.filter(hole__par=3).count()
        driving_holes = total_holes - par_3_count

        if driving_holes == 0:
            return 0.0

        return round((obj.fairways_hit / driving_holes) * 100, 1)

    def get_gir_percentage(self, obj):
        if obj.greens_in_regulation == 0:
            return 0.0

        total_holes = obj.round.hole_scores.count()
        if total_holes == 0:
            total_holes = 18

        return round((obj.greens_in_regulation / total_holes) * 100, 1)

    def get_putts_per_hole(self, obj):
        if obj.total_putts == 0:
            return 0.0

        total_holes = obj.round.hole_scores.count()
        if total_holes == 0:
            total_holes = 18

        return round(obj.total_putts / total_holes, 2)

    def get_scoring_average(self, obj):
        if hasattr(obj.round, 'score') and obj.round.score:
            return obj.round.score.gross_score
        return None


class StatsCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stats
        fields = [
            'round', 'fairways_hit', 'greens_in_regulation', 'total_putts',
            'eagles', 'birdies', 'pars', 'bogeys', 'double_bogeys'
        ]

    def validate_fairways_hit(self, value):
        if value < 0 or value > 14:
            raise serializers.ValidationError("Fairways hit must be between 0 and 14")
        return value

    def validate_greens_in_regulation(self, value):
        if value < 0 or value > 18:
            raise serializers.ValidationError("Greens in regulation must be between 0 and 18")
        return value

    def validate_total_putts(self, value):
        if value < 0:
            raise serializers.ValidationError("Total putts cannot be negative")
        return value

    def validate(self, attrs):
        round_instance = attrs.get('round')
        eagles = attrs.get('eagles', 0)
        birdies = attrs.get('birdies', 0)
        pars = attrs.get('pars', 0)
        bogeys = attrs.get('bogeys', 0)
        double_bogeys = attrs.get('double_bogeys', 0)
        fairways_hit = attrs.get('fairways_hit', 0)
        gir = attrs.get('greens_in_regulation', 0)

        if round_instance:
            total_holes_in_round = round_instance.hole_scores.count()
            if total_holes_in_round == 0:
                total_holes_in_round = 18

            par_3_count = round_instance.hole_scores.filter(hole__par=3).count()
            driving_holes = total_holes_in_round - par_3_count

            if fairways_hit > driving_holes:
                raise serializers.ValidationError(
                    f"Fairways hit ({fairways_hit}) cannot exceed driving holes ({driving_holes})"
                )

            if gir > total_holes_in_round:
                raise serializers.ValidationError(
                    f"Greens in regulation ({gir}) cannot exceed total holes ({total_holes_in_round})"
                )

        total_scoring_holes = eagles + birdies + pars + bogeys + double_bogeys
        if total_scoring_holes > 18:
            raise serializers.ValidationError(
                "Total of eagles, birdies, pars, bogeys, and double bogeys cannot exceed 18"
            )

        return attrs


class StatsUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stats
        fields = [
            'fairways_hit', 'greens_in_regulation', 'total_putts',
            'eagles', 'birdies', 'pars', 'bogeys', 'double_bogeys'
        ]

    def validate_fairways_hit(self, value):
        if value < 0 or value > 18:
            raise serializers.ValidationError("Fairways hit must be between 0 and 18")
        return value

    def validate_greens_in_regulation(self, value):
        if value < 0 or value > 18:
            raise serializers.ValidationError("Greens in regulation must be between 0 and 18")
        return value

    def validate_total_putts(self, value):
        if value < 0:
            raise serializers.ValidationError("Total putts cannot be negative")
        return value


class StatsAggregateSerializer(serializers.Serializer):
    total_rounds = serializers.IntegerField()
    avg_fairways_hit = serializers.FloatField()
    avg_gir = serializers.FloatField()
    avg_putts = serializers.FloatField()
    avg_score = serializers.FloatField()
    total_eagles = serializers.IntegerField()
    total_birdies = serializers.IntegerField()
    total_pars = serializers.IntegerField()
    total_bogeys = serializers.IntegerField()
    total_double_bogeys = serializers.IntegerField()
    avg_birdies_per_round = serializers.FloatField()
    avg_pars_per_round = serializers.FloatField()
    avg_bogeys_per_round = serializers.FloatField()
    avg_double_bogeys_per_round = serializers.FloatField()
    fairway_percentage = serializers.FloatField()
    gir_percentage = serializers.FloatField()
    putts_per_hole = serializers.FloatField()


class ScoreTrendSerializer(serializers.Serializer):
    date = serializers.DateField()
    course_name = serializers.CharField()
    net_score = serializers.IntegerField()
    gross_score = serializers.IntegerField()


class CourseStatisticsSerializer(serializers.Serializer):
    unique_courses = serializers.IntegerField()
    most_played_course = serializers.CharField(allow_null=True)
    most_played_count = serializers.IntegerField()
