from decimal import Decimal
from .models import HandicapHistory, Profile
from apps.rounds.models import Round


class HandicapCalculationService:
    """
    Service for calculating and managing user handicap indices.
    """

    @staticmethod
    def calculate_score_differential(round_instance):
        """
        Calculate score differential for a single round.

        Formula: (gross_score - course_rating) * 113 / slope_rating

        Args:
            round_instance: Round object

        Returns:
            Decimal: Score differential, or None if data is missing
        """
        try:
            # Get gross score
            if not hasattr(round_instance, 'score') or round_instance.score is None:
                return None

            gross_score = round_instance.score.gross_score

            # Get course rating and slope
            course_tee = round_instance.course_tee
            if course_tee.rating is None or course_tee.slope is None:
                return None

            rating = float(course_tee.rating)
            slope = float(course_tee.slope)

            # Calculate differential
            differential = (gross_score - rating) * 113 / slope

            return Decimal(str(round(differential, 1)))

        except Exception as e:
            print(f"Error calculating differential for round {round_instance.id}: {e}")
            return None

    @staticmethod
    def get_handicap_index(user):
        """
        Calculate handicap index for a user based on their rounds.

        Rules:
        - < 5 rounds: No handicap
        - 5-10 rounds: Average of best 4 differentials
        - 11-19 rounds: Average of best 6 differentials
        - 20+ rounds: Average of best 8 differentials from last 20 rounds

        Args:
            user: CustomUser object

        Returns:
            tuple: (handicap_index, rounds_count, differentials_used) or (None, 0, 0)
        """
        # Get all rounds ordered by date (most recent first)
        rounds = Round.objects.filter(user=user).select_related(
            'score', 'course_tee'
        ).order_by('-date')

        # Calculate differentials for all rounds
        differentials = []
        for round_instance in rounds:
            diff = HandicapCalculationService.calculate_score_differential(round_instance)
            if diff is not None:
                differentials.append(diff)

        rounds_count = len(differentials)

        # Not enough rounds
        if rounds_count < 5:
            return None, rounds_count, 0

        # Sort differentials (best = lowest)
        differentials.sort()

        # Apply calculation rules based on round count
        if rounds_count <= 10:
            # Use best 4 differentials
            best_diffs = differentials[:4]
            differentials_used = 4
        elif rounds_count <= 19:
            # Use best 6 differentials
            best_diffs = differentials[:6]
            differentials_used = 6
        else:
            # Use last 20 rounds only
            last_20_diffs = differentials[:20]
            last_20_diffs.sort()
            # Use best 8 from those 20
            best_diffs = last_20_diffs[:8]
            differentials_used = 8

        # Calculate average and round to 1 decimal
        average = sum(best_diffs) / len(best_diffs)
        handicap_index = round(float(average), 1)

        return handicap_index, rounds_count, differentials_used

    @staticmethod
    def update_user_handicap(user):
        """
        Calculate and update user's handicap index.
        Creates HandicapHistory record and updates Profile.

        Args:
            user: CustomUser object

        Returns:
            Decimal: New handicap index, or None if not enough rounds
        """
        handicap_index, rounds_count, differentials_used = HandicapCalculationService.get_handicap_index(user)

        if handicap_index is None:
            print(f"User {user.email} has {rounds_count} rounds - not enough for handicap calculation (need 5+)")
            return None

        # Create handicap history record
        HandicapHistory.objects.create(
            user=user,
            handicap_index=handicap_index,
            rounds_count=rounds_count,
            differentials_used=differentials_used
        )

        # Update profile
        profile, created = Profile.objects.get_or_create(user=user)
        profile.handicap_index = handicap_index
        profile.save()

        print(f"Updated handicap for {user.email}: {handicap_index} (from {rounds_count} rounds, using {differentials_used} differentials)")

        return handicap_index

    @staticmethod
    def preview_handicap_with_round(user, gross_score, course_tee):
        """
        Calculate what handicap would be if a new round is added.

        Args:
            user: CustomUser object
            gross_score: int - gross score for the new round
            course_tee: CourseTee - tee information for rating/slope

        Returns:
            dict: {
                'current_handicap': float or None,
                'pending_handicap': float or None,
                'rounds_count': int (current count, not including new round),
                'will_have_handicap': bool
            }
        """
        from apps.courses.models import CourseTee

        # Get current handicap
        try:
            profile = user.profile
            current_handicap = float(profile.handicap_index) if profile.handicap_index else None
        except:
            current_handicap = None

        # Validate course_tee has rating and slope
        if course_tee.rating is None or course_tee.slope is None:
            return {
                'current_handicap': current_handicap,
                'pending_handicap': None,
                'rounds_count': 0,
                'will_have_handicap': False,
                'error': 'Course rating or slope missing'
            }

        # Get existing rounds and calculate their differentials
        rounds = Round.objects.filter(user=user).select_related(
            'score', 'course_tee'
        ).order_by('-date')

        existing_differentials = []
        for round_instance in rounds:
            diff = HandicapCalculationService.calculate_score_differential(round_instance)
            if diff is not None:
                existing_differentials.append(diff)

        # Calculate differential for the new (pending) round
        rating = float(course_tee.rating)
        slope = float(course_tee.slope)
        new_differential = (gross_score - rating) * 113 / slope
        new_differential = Decimal(str(round(new_differential, 1)))

        # Combine all differentials (existing + new)
        all_differentials = existing_differentials + [new_differential]
        total_rounds = len(all_differentials)

        # Check if will have enough rounds for handicap
        if total_rounds < 5:
            return {
                'current_handicap': current_handicap,
                'pending_handicap': None,
                'rounds_count': len(existing_differentials),
                'will_have_handicap': False
            }

        # Sort differentials (best = lowest)
        all_differentials.sort()

        # Apply calculation rules based on round count
        if total_rounds <= 10:
            # Use best 4 differentials
            best_diffs = all_differentials[:4]
        elif total_rounds <= 19:
            # Use best 6 differentials
            best_diffs = all_differentials[:6]
        else:
            # Use last 20 rounds only
            last_20_diffs = all_differentials[:20]
            last_20_diffs.sort()
            # Use best 8 from those 20
            best_diffs = last_20_diffs[:8]

        # Calculate average and round to 1 decimal
        average = sum(best_diffs) / len(best_diffs)
        pending_handicap = round(float(average), 1)

        return {
            'current_handicap': current_handicap,
            'pending_handicap': pending_handicap,
            'rounds_count': len(existing_differentials),
            'will_have_handicap': True
        }
