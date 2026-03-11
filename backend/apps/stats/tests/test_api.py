from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.courses.models import Course, Tee, Hole
from apps.rounds.models import Round, HoleScore
from apps.stats.models import Stats
from apps.users.models import Profile

User = get_user_model()


class StatsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.profile = Profile.objects.create(
            user=self.user,
            handicap_index=15.0
        )
        self.client.force_authenticate(user=self.user)
        
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
        
        for i in range(1, 19):
            par = 3 if i in [3, 7, 12, 16] else 4
            Hole.objects.create(
                tee=self.tee,
                hole_number=i,
                par=par,
                yardage=400 if par == 4 else 180,
                handicap=i
            )
        
        self.round = Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=1
        )

    def test_create_stats(self):
        data = {
            'round': self.round.id,
            'fairways_hit': 10,
            'greens_in_regulation': 12,
            'total_putts': 32,
            'eagles': 0,
            'birdies': 2,
            'pars': 10,
            'bogeys': 4,
            'double_bogeys': 2
        }
        response = self.client.post('/api/stats/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['fairways_hit'], 10)
        self.assertEqual(response.data['greens_in_regulation'], 12)

    def test_list_stats(self):
        Stats.objects.create(
            round=self.round,
            fairways_hit=10,
            greens_in_regulation=12,
            total_putts=32
        )
        
        response = self.client.get('/api/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_get_aggregate_stats(self):
        for i in range(3):
            round_obj = Round.objects.create(
                user=self.user,
                course=self.course,
                tee=self.tee,
                date=f'2024-01-{15+i:02d}',
                score_type=1
            )
            Stats.objects.create(
                round=round_obj,
                fairways_hit=10,
                greens_in_regulation=12,
                total_putts=30,
                birdies=2,
                pars=10,
                bogeys=4,
                double_bogeys=2
            )
        
        response = self.client.get('/api/stats/aggregate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_rounds', response.data)
        self.assertIn('avg_fairways_hit', response.data)
        self.assertIn('avg_greens_in_regulation', response.data)
        self.assertIn('avg_putts', response.data)
        self.assertEqual(response.data['total_rounds'], 3)

    def test_get_performance_trends(self):
        for i in range(5):
            round_obj = Round.objects.create(
                user=self.user,
                course=self.course,
                tee=self.tee,
                date=f'2024-01-{15+i:02d}',
                score_type=1
            )
            Stats.objects.create(
                round=round_obj,
                fairways_hit=10 + i,
                greens_in_regulation=12 + i,
                total_putts=30 - i
            )
        
        response = self.client.get('/api/stats/trends/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)
        self.assertIn('date', response.data[0])
        self.assertIn('fairways_hit', response.data[0])

    def test_get_best_stats(self):
        for i in range(3):
            round_obj = Round.objects.create(
                user=self.user,
                course=self.course,
                tee=self.tee,
                date=f'2024-01-{15+i:02d}',
                score_type=1
            )
            Stats.objects.create(
                round=round_obj,
                fairways_hit=10 + i,
                greens_in_regulation=12 + i,
                total_putts=32 - i,
                birdies=i
            )
        
        response = self.client.get('/api/stats/best/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('best_fairways_hit', response.data)
        self.assertIn('best_gir', response.data)
        self.assertIn('best_putts', response.data)

    def test_stats_user_isolation(self):
        other_user = User.objects.create_user(
            email='other@example.com',
            username='otheruser',
            password='TestPass123!'
        )
        other_round = Round.objects.create(
            user=other_user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=1
        )
        Stats.objects.create(
            round=other_round,
            fairways_hit=14,
            greens_in_regulation=16,
            total_putts=28
        )
        
        response = self.client.get('/api/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_stats_require_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/stats/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class StatsCalculationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.profile = Profile.objects.create(
            user=self.user,
            handicap_index=15.0
        )
        self.client.force_authenticate(user=self.user)
        
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
        
        self.holes = []
        for i in range(1, 19):
            par = 3 if i in [3, 7, 12, 16] else (5 if i in [5, 14] else 4)
            hole = Hole.objects.create(
                tee=self.tee,
                hole_number=i,
                par=par,
                yardage=500 if par == 5 else (180 if par == 3 else 400),
                handicap=i
            )
            self.holes.append(hole)
        
        self.round = Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=1
        )

    def test_auto_calculate_stats_from_hole_scores(self):
        for i, hole in enumerate(self.holes):
            par = hole.par
            if i == 0:
                strokes = par - 1
            elif i < 5:
                strokes = par
            elif i < 10:
                strokes = par + 1
            else:
                strokes = par + 2
            
            HoleScore.objects.create(
                round=self.round,
                hole=hole,
                strokes=strokes,
                putts=2,
                fairway_hit=(hole.par != 3),
                gir=(strokes <= par)
            )
        
        response = self.client.post(f'/api/stats/calculate/{self.round.id}/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        stats = Stats.objects.get(round=self.round)
        self.assertEqual(stats.birdies, 1)
        self.assertGreater(stats.pars, 0)
        self.assertGreater(stats.bogeys, 0)
        self.assertGreater(stats.double_bogeys, 0)
