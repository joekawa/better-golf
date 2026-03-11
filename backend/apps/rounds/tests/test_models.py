from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.courses.models import Course, Tee, Hole
from apps.rounds.models import Round, Score, HoleScore
from decimal import Decimal

User = get_user_model()


class RoundModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.course = Course.objects.create(
            name='Test Golf Course',
            created_by=self.user
        )
        self.tee = Tee.objects.create(
            course=self.course,
            name='Blue',
            color='Blue',
            rating=72.5,
            slope=130,
            par=72,
            yardage=6800
        )
        self.round = Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=0
        )

    def test_round_creation(self):
        self.assertEqual(self.round.user, self.user)
        self.assertEqual(self.round.course, self.course)
        self.assertEqual(self.round.tee, self.tee)
        self.assertEqual(str(self.round.date), '2024-01-15')
        self.assertEqual(self.round.score_type, 0)

    def test_round_string_representation(self):
        expected = 'test@example.com - Test Golf Course on 2024-01-15'
        self.assertEqual(str(self.round), expected)

    def test_round_score_type_display(self):
        self.assertEqual(self.round.get_score_type_display(), 'Total Score')
        
        hole_by_hole_round = Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-16',
            score_type=1
        )
        self.assertEqual(hole_by_hole_round.get_score_type_display(), 'Hole-by-Hole')


class ScoreModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.course = Course.objects.create(
            name='Test Golf Course',
            created_by=self.user
        )
        self.tee = Tee.objects.create(
            course=self.course,
            name='Blue',
            color='Blue',
            rating=72.5,
            slope=130,
            par=72,
            yardage=6800
        )
        self.round = Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=0
        )
        self.score = Score.objects.create(
            round=self.round,
            gross_score=85,
            net_score=75
        )

    def test_score_creation(self):
        self.assertEqual(self.score.round, self.round)
        self.assertEqual(self.score.gross_score, 85)
        self.assertEqual(self.score.net_score, 75)

    def test_score_string_representation(self):
        expected = 'test@example.com - Test Golf Course on 2024-01-15: 85 (75 net)'
        self.assertEqual(str(self.score), expected)

    def test_score_optional_adjusted_gross(self):
        score = Score.objects.create(
            round=self.round,
            gross_score=90,
            net_score=80,
            adjusted_gross_score=88
        )
        self.assertEqual(score.adjusted_gross_score, 88)


class HoleScoreModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.course = Course.objects.create(
            name='Test Golf Course',
            created_by=self.user
        )
        self.tee = Tee.objects.create(
            course=self.course,
            name='Blue',
            color='Blue',
            rating=72.5,
            slope=130,
            par=72,
            yardage=6800
        )
        self.hole = Hole.objects.create(
            tee=self.tee,
            hole_number=1,
            par=4,
            yardage=420,
            handicap=5
        )
        self.round = Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=1
        )
        self.hole_score = HoleScore.objects.create(
            round=self.round,
            hole=self.hole,
            strokes=5,
            putts=2,
            fairway_hit=True,
            gir=False
        )

    def test_hole_score_creation(self):
        self.assertEqual(self.hole_score.round, self.round)
        self.assertEqual(self.hole_score.hole, self.hole)
        self.assertEqual(self.hole_score.strokes, 5)
        self.assertEqual(self.hole_score.putts, 2)
        self.assertTrue(self.hole_score.fairway_hit)
        self.assertFalse(self.hole_score.gir)

    def test_hole_score_string_representation(self):
        expected = 'test@example.com - Test Golf Course - Hole 1: 5 strokes'
        self.assertEqual(str(self.hole_score), expected)

    def test_hole_score_ordering(self):
        hole2 = Hole.objects.create(
            tee=self.tee,
            hole_number=2,
            par=3,
            yardage=180,
            handicap=15
        )
        hole_score2 = HoleScore.objects.create(
            round=self.round,
            hole=hole2,
            strokes=3,
            putts=1
        )
        
        hole_scores = list(HoleScore.objects.filter(round=self.round))
        self.assertEqual(hole_scores[0], self.hole_score)
        self.assertEqual(hole_scores[1], hole_score2)

    def test_hole_score_unique_constraint(self):
        with self.assertRaises(Exception):
            HoleScore.objects.create(
                round=self.round,
                hole=self.hole,
                strokes=4,
                putts=2
            )
