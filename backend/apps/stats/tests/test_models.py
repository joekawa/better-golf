from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.courses.models import Course, Tee, Hole
from apps.rounds.models import Round, HoleScore
from apps.stats.models import Stats

User = get_user_model()


class StatsModelTest(TestCase):
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
            score_type=1
        )
        self.stats = Stats.objects.create(
            round=self.round,
            fairways_hit=10,
            greens_in_regulation=12,
            total_putts=32,
            eagles=0,
            birdies=2,
            pars=10,
            bogeys=4,
            double_bogeys=2
        )

    def test_stats_creation(self):
        self.assertEqual(self.stats.round, self.round)
        self.assertEqual(self.stats.fairways_hit, 10)
        self.assertEqual(self.stats.greens_in_regulation, 12)
        self.assertEqual(self.stats.total_putts, 32)
        self.assertEqual(self.stats.eagles, 0)
        self.assertEqual(self.stats.birdies, 2)
        self.assertEqual(self.stats.pars, 10)
        self.assertEqual(self.stats.bogeys, 4)
        self.assertEqual(self.stats.double_bogeys, 2)

    def test_stats_string_representation(self):
        expected = 'Stats for test@example.com - Test Golf Course on 2024-01-15'
        self.assertEqual(str(self.stats), expected)

    def test_stats_default_values(self):
        stats = Stats.objects.create(round=self.round)
        self.assertEqual(stats.fairways_hit, 0)
        self.assertEqual(stats.greens_in_regulation, 0)
        self.assertEqual(stats.total_putts, 0)
        self.assertEqual(stats.eagles, 0)
        self.assertEqual(stats.birdies, 0)
        self.assertEqual(stats.pars, 0)
        self.assertEqual(stats.bogeys, 0)
        self.assertEqual(stats.double_bogeys, 0)

    def test_stats_unique_per_round(self):
        with self.assertRaises(Exception):
            Stats.objects.create(
                round=self.round,
                fairways_hit=8,
                greens_in_regulation=10,
                total_putts=30
            )

    def test_stats_ordering(self):
        round2 = Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-16',
            score_type=1
        )
        stats2 = Stats.objects.create(
            round=round2,
            fairways_hit=12,
            greens_in_regulation=14,
            total_putts=28
        )
        
        all_stats = list(Stats.objects.all())
        self.assertEqual(all_stats[0], stats2)
        self.assertEqual(all_stats[1], self.stats)
