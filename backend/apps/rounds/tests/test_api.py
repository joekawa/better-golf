from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.courses.models import Course, Tee, Hole
from apps.rounds.models import Round, Score, HoleScore
from apps.users.models import Profile
from decimal import Decimal

User = get_user_model()


class RoundAPITest(TestCase):
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
            Hole.objects.create(
                tee=self.tee,
                hole_number=i,
                par=4,
                yardage=400,
                handicap=i
            )

    def test_create_round_total_score(self):
        data = {
            'course': self.course.id,
            'tee': self.tee.id,
            'date': '2024-01-15',
            'score_type': 0,
            'gross_score': 85,
            'net_score': 75
        }
        response = self.client.post('/api/rounds/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['course_name'], 'Test Golf Course')
        
        round_obj = Round.objects.get(id=response.data['id'])
        self.assertEqual(round_obj.user, self.user)
        self.assertTrue(Score.objects.filter(round=round_obj).exists())
        
        score = Score.objects.get(round=round_obj)
        self.assertEqual(score.gross_score, 85)
        self.assertEqual(score.net_score, 75)

    def test_create_round_hole_by_hole(self):
        hole_scores = []
        for i in range(1, 19):
            hole = Hole.objects.get(tee=self.tee, hole_number=i)
            hole_scores.append({
                'hole': hole.id,
                'strokes': 4,
                'putts': 2,
                'fairway_hit': True,
                'gir': True
            })
        
        data = {
            'course': self.course.id,
            'tee': self.tee.id,
            'date': '2024-01-15',
            'score_type': 1,
            'hole_scores': hole_scores
        }
        response = self.client.post('/api/rounds/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        round_obj = Round.objects.get(id=response.data['id'])
        self.assertEqual(HoleScore.objects.filter(round=round_obj).count(), 18)

    def test_list_rounds(self):
        Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=0
        )
        
        response = self.client.get('/api/rounds/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_rounds_by_course(self):
        Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=0
        )
        
        other_course = Course.objects.create(
            name='Other Course',
            created_by=self.user
        )
        other_tee = Tee.objects.create(
            course=other_course,
            name='Blue',
            color='Blue',
            rating=70.0,
            slope=120,
            par=72,
            yardage=6500
        )
        Round.objects.create(
            user=self.user,
            course=other_course,
            tee=other_tee,
            date='2024-01-16',
            score_type=0
        )
        
        response = self.client.get(f'/api/rounds/?course={self.course.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_get_recent_rounds(self):
        for i in range(1, 8):
            Round.objects.create(
                user=self.user,
                course=self.course,
                tee=self.tee,
                date=f'2024-01-{i:02d}',
                score_type=0
            )
        
        response = self.client.get('/api/rounds/recent/?limit=5')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)

    def test_get_round_hole_scores(self):
        round_obj = Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=1
        )
        
        hole = Hole.objects.get(tee=self.tee, hole_number=1)
        HoleScore.objects.create(
            round=round_obj,
            hole=hole,
            strokes=5,
            putts=2
        )
        
        response = self.client.get(f'/api/rounds/{round_obj.id}/hole_scores/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['strokes'], 5)

    def test_rounds_user_isolation(self):
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
            score_type=0
        )
        
        response = self.client.get('/api/rounds/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        
        response = self.client.get(f'/api/rounds/{other_round.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_rounds_require_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/rounds/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RoundStatsAPITest(TestCase):
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

    def test_get_stats_summary(self):
        round_obj = Round.objects.create(
            user=self.user,
            course=self.course,
            tee=self.tee,
            date='2024-01-15',
            score_type=0
        )
        Score.objects.create(
            round=round_obj,
            gross_score=85,
            net_score=75
        )
        
        response = self.client.get('/api/rounds/stats_summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_rounds', response.data)
        self.assertIn('average_score', response.data)
