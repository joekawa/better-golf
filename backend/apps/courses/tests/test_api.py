from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.courses.models import Course, Tee, Hole
from unittest.mock import patch, MagicMock

User = get_user_model()


class CourseAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.client.force_authenticate(user=self.user)
        self.course = Course.objects.create(
            name='Test Golf Course',
            city='Test City',
            state='CA',
            country='USA',
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

    def test_list_courses(self):
        response = self.client.get('/api/courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Golf Course')

    def test_retrieve_course(self):
        response = self.client.get(f'/api/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Golf Course')
        self.assertEqual(response.data['city'], 'Test City')

    def test_filter_courses_by_city(self):
        Course.objects.create(
            name='Another Course',
            city='Other City',
            state='CA',
            created_by=self.user
        )
        response = self.client.get('/api/courses/?city=Test City')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['city'], 'Test City')

    def test_filter_courses_by_state(self):
        response = self.client.get('/api/courses/?state=CA')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_get_course_tees(self):
        response = self.client.get(f'/api/courses/{self.course.id}/tees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Blue')

    def test_courses_require_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/courses/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CourseSearchAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.client.force_authenticate(user=self.user)

    @patch('apps.courses.services.GolfCourseAPIService.search_courses')
    def test_search_courses_success(self, mock_search):
        mock_search.return_value = [
            {
                'id': 12345,
                'name': 'Pebble Beach Golf Links',
                'city': 'Pebble Beach',
                'state': 'CA',
                'country': 'USA'
            }
        ]
        
        response = self.client.get('/api/courses/search/?query=Pebble Beach')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Pebble Beach Golf Links')
        mock_search.assert_called_once()

    @patch('apps.courses.services.GolfCourseAPIService.search_courses')
    def test_search_courses_requires_query(self, mock_search):
        response = self.client.get('/api/courses/search/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_search.assert_not_called()

    @patch('apps.courses.services.GolfCourseAPIService.search_courses')
    def test_search_courses_api_error(self, mock_search):
        mock_search.side_effect = Exception('API Error')
        
        response = self.client.get('/api/courses/search/?query=Test')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class CourseSaveAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.client.force_authenticate(user=self.user)

    @patch('apps.courses.services.GolfCourseAPIService.get_course_details')
    @patch('apps.courses.services.GolfCourseAPIService.save_course_to_db')
    def test_save_course_success(self, mock_save, mock_get_details):
        mock_course_data = {
            'id': 12345,
            'name': 'Pebble Beach Golf Links',
            'city': 'Pebble Beach',
            'state': 'CA',
            'country': 'USA'
        }
        mock_get_details.return_value = mock_course_data
        
        mock_course = Course.objects.create(
            name='Pebble Beach Golf Links',
            city='Pebble Beach',
            state='CA',
            country='USA',
            created_by=self.user
        )
        mock_save.return_value = mock_course
        
        response = self.client.post('/api/courses/save/', {'api_course_id': 12345})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Pebble Beach Golf Links')
        mock_get_details.assert_called_once_with(12345)
        mock_save.assert_called_once()

    def test_save_course_missing_id(self):
        response = self.client.post('/api/courses/save/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
