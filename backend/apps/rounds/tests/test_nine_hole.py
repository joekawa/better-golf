from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.courses.models import Course, CourseTee, Hole
from apps.rounds.models import Round, RoundScore, ScoreType
from apps.users.models import Profile
from apps.users.services import HandicapCalculationService

User = get_user_model()


def _make_user(email='golfer@example.com'):
    user = User.objects.create_user(email=email, username=email, password='pass')
    Profile.objects.create(user=user, display_name='Golfer', handicap_index=Decimal('18.0'))
    return user


def _make_course_and_tee(with_side_ratings=True):
    course = Course.objects.create(name='Test Course', city='Austin', state='TX', country='US')
    kwargs = dict(
        course=course,
        name='Blue',
        slope=130,
        rating=Decimal('72.0'),
        par=72,
    )
    if with_side_ratings:
        kwargs.update(
            front_course_rating=Decimal('36.5'),
            back_course_rating=Decimal('35.5'),
            front_slope_rating=131,
            back_slope_rating=129,
        )
    tee = CourseTee.objects.create(**kwargs)
    score_type = ScoreType.objects.create(type=ScoreType.TOTAL)
    return course, tee, score_type


class RoundSegmentDefaultsTest(TestCase):
    def test_default_segment_is_full_18(self):
        user = _make_user()
        course, tee, score_type = _make_course_and_tee()
        r = Round.objects.create(
            user=user, course=course, course_tee=tee,
            score_type=score_type, date='2025-01-01'
        )
        self.assertEqual(r.holes_played, 18)
        self.assertEqual(r.hole_segment, Round.FULL_18)

    def test_expected_hole_numbers_full_18(self):
        user = _make_user()
        course, tee, score_type = _make_course_and_tee()
        r = Round(holes_played=18, hole_segment=Round.FULL_18)
        self.assertEqual(r.expected_hole_numbers, list(range(1, 19)))

    def test_expected_hole_numbers_front_9(self):
        r = Round(holes_played=9, hole_segment=Round.FRONT_9)
        self.assertEqual(r.expected_hole_numbers, list(range(1, 10)))

    def test_expected_hole_numbers_back_9(self):
        r = Round(holes_played=9, hole_segment=Round.BACK_9)
        self.assertEqual(r.expected_hole_numbers, list(range(10, 19)))


class HandicapDifferentialNineHoleTest(TestCase):
    def _make_round(self, gross, segment, with_side_ratings=True):
        user = _make_user()
        course, tee, score_type = _make_course_and_tee(with_side_ratings=with_side_ratings)
        holes_played = 9 if segment != Round.FULL_18 else 18
        r = Round.objects.create(
            user=user, course=course, course_tee=tee,
            score_type=score_type, date='2025-01-01',
            holes_played=holes_played, hole_segment=segment
        )
        RoundScore.objects.create(round=r, gross_score=gross, net_score=gross - 5)
        return r

    def test_full_18_uses_full_rating(self):
        r = self._make_round(gross=90, segment=Round.FULL_18)
        diff = HandicapCalculationService.calculate_score_differential(r)
        expected = round((90 - 72.0) * 113 / 130, 1)
        self.assertAlmostEqual(float(diff), expected, places=1)

    def test_front_9_uses_front_rating(self):
        r = self._make_round(gross=45, segment=Round.FRONT_9)
        diff = HandicapCalculationService.calculate_score_differential(r)
        expected = round((45 - 36.5) * 113 / 131, 1)
        self.assertAlmostEqual(float(diff), expected, places=1)

    def test_back_9_uses_back_rating(self):
        r = self._make_round(gross=44, segment=Round.BACK_9)
        diff = HandicapCalculationService.calculate_score_differential(r)
        expected = round((44 - 35.5) * 113 / 129, 1)
        self.assertAlmostEqual(float(diff), expected, places=1)

    def test_front_9_fallback_when_no_side_ratings(self):
        r = self._make_round(gross=45, segment=Round.FRONT_9, with_side_ratings=False)
        diff = HandicapCalculationService.calculate_score_differential(r)
        fallback_rating = 72.0 / 2
        expected = round((45 - fallback_rating) * 113 / 130, 1)
        self.assertAlmostEqual(float(diff), expected, places=1)

    def test_back_9_fallback_when_no_side_ratings(self):
        r = self._make_round(gross=44, segment=Round.BACK_9, with_side_ratings=False)
        diff = HandicapCalculationService.calculate_score_differential(r)
        fallback_rating = 72.0 / 2
        expected = round((44 - fallback_rating) * 113 / 130, 1)
        self.assertAlmostEqual(float(diff), expected, places=1)

    def test_no_score_returns_none(self):
        user = _make_user()
        course, tee, score_type = _make_course_and_tee()
        r = Round.objects.create(
            user=user, course=course, course_tee=tee,
            score_type=score_type, date='2025-01-01',
            holes_played=9, hole_segment=Round.FRONT_9
        )
        self.assertIsNone(HandicapCalculationService.calculate_score_differential(r))


class CourseTeeNineHoleFieldsTest(TestCase):
    def test_tee_stores_side_ratings(self):
        course = Course.objects.create(name='Course', city='X', state='TX', country='US')
        tee = CourseTee.objects.create(
            course=course, name='Red', slope=115, rating=Decimal('70.0'), par=72,
            front_course_rating=Decimal('35.2'), back_course_rating=Decimal('34.8'),
            front_slope_rating=116, back_slope_rating=114,
        )
        tee.refresh_from_db()
        self.assertEqual(tee.front_course_rating, Decimal('35.2'))
        self.assertEqual(tee.back_course_rating, Decimal('34.8'))
        self.assertEqual(tee.front_slope_rating, 116)
        self.assertEqual(tee.back_slope_rating, 114)

    def test_tee_side_ratings_nullable(self):
        course = Course.objects.create(name='Course2', city='X', state='TX', country='US')
        tee = CourseTee.objects.create(
            course=course, name='White', slope=120, rating=Decimal('71.0'), par=72
        )
        tee.refresh_from_db()
        self.assertIsNone(tee.front_course_rating)
        self.assertIsNone(tee.back_course_rating)
        self.assertIsNone(tee.front_slope_rating)
        self.assertIsNone(tee.back_slope_rating)
