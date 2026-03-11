from django.db.models import Avg, Sum, Count
from .models import Stats
from apps.rounds.models import Round, HoleScore


class StatsCalculationService:
    """
    Service class for calculating golf statistics
    """

    @staticmethod
    def calculate_stats_from_hole_scores(round_instance):
        """
        Calculate statistics from hole-by-hole scores

        Args:
            round_instance: Round instance with hole scores

        Returns:
            dict: Calculated statistics including scoring, FIR, GIR, and putts
        """
        hole_scores = round_instance.hole_scores.select_related('hole').all()

        if not hole_scores.exists():
            return None

        eagles = 0
        birdies = 0
        pars = 0
        bogeys = 0
        double_bogeys = 0
        fairways_hit = 0
        greens_in_regulation = 0
        total_putts = 0

        for hole_score in hole_scores:
            par = hole_score.hole.par
            score = hole_score.score
            diff = score - par

            # Scoring statistics
            if diff <= -3:
                # Albatross (3+ under par) - count as eagle since we don't have separate field
                eagles += 1
            elif diff == -2:
                # Eagle (2 under par)
                eagles += 1
            elif diff == -1:
                # Birdie (1 under par)
                birdies += 1
            elif diff == 0:
                # Par
                pars += 1
            elif diff == 1:
                # Bogey (1 over par)
                bogeys += 1
            elif diff >= 2:
                # Double bogey or worse (2+ over par)
                double_bogeys += 1

            # FIR, GIR, and putts
            if hole_score.fairway_hit:
                fairways_hit += 1
            if hole_score.gir:
                greens_in_regulation += 1
            total_putts += hole_score.putts

        return {
            'eagles': eagles,
            'birdies': birdies,
            'pars': pars,
            'bogeys': bogeys,
            'double_bogeys': double_bogeys,
            'fairways_hit': fairways_hit,
            'greens_in_regulation': greens_in_regulation,
            'total_putts': total_putts
        }

    @staticmethod
    def get_user_aggregate_stats(user, date_from=None, date_to=None, limit=None):
        """
        Get aggregate statistics for a user across multiple rounds

        Args:
            user: User instance
            date_from: Optional start date filter
            date_to: Optional end date filter
            limit: Optional limit on number of recent rounds to analyze

        Returns:
            dict: Aggregate statistics
        """
        rounds_queryset = Round.objects.filter(user=user).order_by('-date')

        if date_from:
            rounds_queryset = rounds_queryset.filter(date__gte=date_from)
        if date_to:
            rounds_queryset = rounds_queryset.filter(date__lte=date_to)
        if limit:
            # Get the IDs first, then create a new queryset to avoid slicing issues
            round_ids = list(rounds_queryset[:limit].values_list('id', flat=True))
            rounds_queryset = Round.objects.filter(id__in=round_ids, user=user).order_by('-date')

        stats_queryset = Stats.objects.filter(round__in=rounds_queryset)

        if not stats_queryset.exists():
            return {
                'total_rounds': 0,
                'avg_fairways_hit': 0.0,
                'avg_gir': 0.0,
                'avg_putts': 0.0,
                'avg_score': 0.0,
                'total_eagles': 0,
                'total_birdies': 0,
                'total_pars': 0,
                'total_bogeys': 0,
                'total_double_bogeys': 0,
                'avg_birdies_per_round': 0.0,
                'avg_pars_per_round': 0.0,
                'avg_bogeys_per_round': 0.0,
                'avg_double_bogeys_per_round': 0.0,
                'fairway_percentage': 0.0,
                'gir_percentage': 0.0,
                'putts_per_hole': 0.0
            }

        aggregates = stats_queryset.aggregate(
            avg_fairways=Avg('fairways_hit'),
            avg_gir=Avg('greens_in_regulation'),
            avg_putts=Avg('total_putts'),
            total_eagles=Sum('eagles'),
            total_birdies=Sum('birdies'),
            total_pars=Sum('pars'),
            total_bogeys=Sum('bogeys'),
            total_double_bogeys=Sum('double_bogeys'),
            total_rounds=Count('id')
        )

        scores_queryset = rounds_queryset.filter(score__isnull=False)
        avg_score = scores_queryset.aggregate(avg=Avg('score__gross_score'))['avg']

        avg_fairways = aggregates['avg_fairways'] or 0.0
        avg_gir = aggregates['avg_gir'] or 0.0
        avg_putts = aggregates['avg_putts'] or 0.0

        total_holes = 0
        total_driving_holes = 0
        for round_instance in rounds_queryset:
            try:
                holes_count = round_instance.hole_scores.count()
                if holes_count == 0:
                    holes_count = 18
                total_holes += holes_count

                par_3_count = round_instance.hole_scores.filter(hole__par=3).count()
                total_driving_holes += (holes_count - par_3_count)
            except Exception as e:
                # If hole_scores aren't available, assume 18 holes with 14 driving holes
                total_holes += 18
                total_driving_holes += 14

        avg_holes_per_round = total_holes / aggregates['total_rounds'] if aggregates['total_rounds'] > 0 else 18
        avg_driving_holes_per_round = total_driving_holes / aggregates['total_rounds'] if aggregates['total_rounds'] > 0 else 14

        fairway_percentage = round((avg_fairways / avg_driving_holes_per_round) * 100, 1) if avg_driving_holes_per_round > 0 and avg_fairways > 0 else 0.0
        gir_percentage = round((avg_gir / avg_holes_per_round) * 100, 1) if avg_holes_per_round > 0 and avg_gir > 0 else 0.0
        putts_per_hole = round(avg_putts / avg_holes_per_round, 2) if avg_holes_per_round > 0 and avg_putts > 0 else 0.0

        total_rounds = aggregates['total_rounds']
        avg_birdies_per_round = round((aggregates['total_birdies'] or 0) / total_rounds, 1) if total_rounds > 0 else 0.0
        avg_pars_per_round = round((aggregates['total_pars'] or 0) / total_rounds, 1) if total_rounds > 0 else 0.0
        avg_bogeys_per_round = round((aggregates['total_bogeys'] or 0) / total_rounds, 1) if total_rounds > 0 else 0.0
        avg_double_bogeys_per_round = round((aggregates['total_double_bogeys'] or 0) / total_rounds, 1) if total_rounds > 0 else 0.0

        return {
            'total_rounds': total_rounds,
            'avg_fairways_hit': round(avg_fairways, 1),
            'avg_gir': round(avg_gir, 1),
            'avg_putts': round(avg_putts, 1),
            'avg_score': round(avg_score, 1) if avg_score else 0.0,
            'total_eagles': aggregates['total_eagles'] or 0,
            'total_birdies': aggregates['total_birdies'] or 0,
            'total_pars': aggregates['total_pars'] or 0,
            'total_bogeys': aggregates['total_bogeys'] or 0,
            'total_double_bogeys': aggregates['total_double_bogeys'] or 0,
            'avg_birdies_per_round': avg_birdies_per_round,
            'avg_pars_per_round': avg_pars_per_round,
            'avg_bogeys_per_round': avg_bogeys_per_round,
            'avg_double_bogeys_per_round': avg_double_bogeys_per_round,
            'fairway_percentage': fairway_percentage,
            'gir_percentage': gir_percentage,
            'putts_per_hole': putts_per_hole
        }

    @staticmethod
    def get_performance_trends(user, limit=10):
        """
        Get performance trends over recent rounds

        Args:
            user: User instance
            limit: Number of recent rounds to analyze

        Returns:
            list: List of round statistics ordered by date
        """
        rounds = Round.objects.filter(
            user=user,
            stats__isnull=False
        ).select_related('score', 'stats').order_by('-date')[:limit]

        trends = []
        for round_instance in rounds:
            if hasattr(round_instance, 'stats'):
                stat = round_instance.stats.first()
                if stat:
                    total_holes = round_instance.hole_scores.count()
                    if total_holes == 0:
                        total_holes = 18

                    par_3_count = round_instance.hole_scores.filter(hole__par=3).count()
                    driving_holes = total_holes - par_3_count

                    fairway_pct = round((stat.fairways_hit / driving_holes) * 100, 1) if driving_holes > 0 else 0.0
                    gir_pct = round((stat.greens_in_regulation / total_holes) * 100, 1) if total_holes > 0 else 0.0
                    putts_per = round(stat.total_putts / total_holes, 2) if total_holes > 0 else 0.0

                    trends.append({
                        'date': round_instance.date,
                        'score': round_instance.score.gross_score if hasattr(round_instance, 'score') else None,
                        'fairways_hit': stat.fairways_hit,
                        'gir': stat.greens_in_regulation,
                        'putts': stat.total_putts,
                        'fairway_percentage': fairway_pct,
                        'gir_percentage': gir_pct,
                        'putts_per_hole': putts_per
                    })

        return trends

    @staticmethod
    def get_best_stats(user):
        """
        Get user's best statistics

        Args:
            user: User instance

        Returns:
            dict: Best statistics across all rounds
        """
        stats_queryset = Stats.objects.filter(round__user=user)

        if not stats_queryset.exists():
            return None

        best_fairways = stats_queryset.order_by('-fairways_hit').first()
        best_gir = stats_queryset.order_by('-greens_in_regulation').first()
        best_putts = stats_queryset.order_by('total_putts').first()
        most_eagles = stats_queryset.order_by('-eagles').first()
        most_birdies = stats_queryset.order_by('-birdies').first()

        return {
            'best_fairways_hit': best_fairways.fairways_hit if best_fairways else 0,
            'best_fairways_date': best_fairways.round.date if best_fairways else None,
            'best_gir': best_gir.greens_in_regulation if best_gir else 0,
            'best_gir_date': best_gir.round.date if best_gir else None,
            'best_putts': best_putts.total_putts if best_putts else 0,
            'best_putts_date': best_putts.round.date if best_putts else None,
            'most_eagles': most_eagles.eagles if most_eagles else 0,
            'most_eagles_date': most_eagles.round.date if most_eagles else None,
            'most_birdies': most_birdies.birdies if most_birdies else 0,
            'most_birdies_date': most_birdies.round.date if most_birdies else None
        }

    @staticmethod
    def get_score_trends(user, limit=10):
        """
        Get score trends over recent rounds

        Args:
            user: User instance
            limit: Number of recent rounds to return

        Returns:
            list: List of score data ordered by date (oldest to newest)
        """
        rounds = Round.objects.filter(
            user=user,
            score__isnull=False
        ).select_related('score', 'course').order_by('-date')

        if limit:
            rounds = rounds[:limit]

        trends = []
        for round_instance in reversed(list(rounds)):
            trends.append({
                'date': round_instance.date.isoformat(),
                'course_name': round_instance.course.name,
                'net_score': round_instance.score.net_score,
                'gross_score': round_instance.score.gross_score
            })

        return trends

    @staticmethod
    def get_course_statistics(user, limit=None):
        """
        Get course-related statistics

        Args:
            user: User instance
            limit: Optional limit on number of recent rounds to analyze

        Returns:
            dict: Course statistics including unique courses and most played
        """
        from django.db.models import Subquery

        rounds_queryset = Round.objects.filter(user=user).order_by('-date')

        if limit:
            # Get the IDs of the limited rounds first
            limited_round_ids = list(rounds_queryset[:limit].values_list('id', flat=True))
            rounds_queryset = Round.objects.filter(id__in=limited_round_ids)

        if not rounds_queryset.exists():
            return {
                'unique_courses': 0,
                'most_played_course': None,
                'most_played_count': 0
            }

        unique_courses = rounds_queryset.values('course').distinct().count()

        most_played = rounds_queryset.values('course__name').annotate(
            count=Count('id')
        ).order_by('-count').first()

        return {
            'unique_courses': unique_courses,
            'most_played_course': most_played['course__name'] if most_played else None,
            'most_played_count': most_played['count'] if most_played else 0
        }
