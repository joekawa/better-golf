from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import Profile
from apps.users.email import generate_verification_token

User = get_user_model()


class UserRegistrationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'

    @patch('apps.users.views.send_verification_email')
    def test_user_registration_success(self, mock_send_email):
        data = {
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password2': 'NewPass123!'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('detail', response.data)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())
        mock_send_email.assert_called_once()

        user = User.objects.get(email='newuser@example.com')
        self.assertEqual(user.username, 'newuser')
        self.assertFalse(user.email_verified)
        self.assertTrue(Profile.objects.filter(user=user).exists())

    def test_user_registration_password_mismatch(self):
        data = {
            'email': 'newuser@example.com',
            'password': 'NewPass123!',
            'password2': 'DifferentPass123!'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_duplicate_email(self):
        User.objects.create_user(
            email='existing@example.com',
            username='existing',
            password='Pass123!'
        )
        data = {
            'email': 'existing@example.com',
            'password': 'NewPass123!',
            'password2': 'NewPass123!'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('apps.users.views.send_verification_email')
    def test_username_auto_generation_with_duplicates(self, mock_send_email):
        User.objects.create_user(
            email='test@example.com',
            username='test',
            password='Pass123!'
        )

        data = {
            'email': 'test@different.com',
            'password': 'NewPass123!',
            'password2': 'NewPass123!'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='test@different.com')
        self.assertEqual(user.username, 'test1')


class UserLoginAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            email_verified=True
        )

    def test_user_login_success(self):
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_login_unverified_email(self):
        unverified = User.objects.create_user(
            email='unverified@example.com',
            username='unverified',
            password='TestPass123!',
            email_verified=False
        )
        data = {
            'email': 'unverified@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_login_wrong_password(self):
        data = {
            'email': 'test@example.com',
            'password': 'WrongPass123!'
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_login_nonexistent_user(self):
        data = {
            'email': 'nonexistent@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class EmailVerificationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.verify_url = '/api/auth/verify-email/'
        self.resend_url = '/api/auth/resend-verification/'
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            email_verified=False
        )

    def test_verify_email_success(self):
        token = generate_verification_token(self.user)
        response = self.client.get(self.verify_url, {'token': token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verified)

    def test_verify_email_missing_token(self):
        response = self.client.get(self.verify_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_invalid_token(self):
        response = self.client.get(self.verify_url, {'token': 'invalidtoken'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_already_verified(self):
        self.user.email_verified = True
        self.user.save()
        token = generate_verification_token(self.user)
        response = self.client.get(self.verify_url, {'token': token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('apps.users.views.send_verification_email')
    def test_resend_verification_success(self, mock_send_email):
        response = self.client.post(self.resend_url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_email.assert_called_once()

    def test_resend_verification_nonexistent_email(self):
        response = self.client.post(self.resend_url, {'email': 'nobody@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_resend_verification_already_verified(self):
        self.user.email_verified = True
        self.user.save()
        response = self.client.post(self.resend_url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.profile = Profile.objects.create(
            user=self.user,
            display_name='Test User',
            handicap_index=15.5
        )
        self.client.force_authenticate(user=self.user)
        self.profile_url = '/api/auth/me/profile/'

    def test_get_profile(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['display_name'], 'Test User')
        self.assertEqual(float(response.data['handicap_index']), 15.5)

    def test_update_profile(self):
        data = {
            'display_name': 'Updated Name',
            'phone_number': '555-9999',
            'handicap_index': '12.3'
        }
        response = self.client.put(self.profile_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.display_name, 'Updated Name')
        self.assertEqual(self.profile.phone_number, '555-9999')
        self.assertEqual(float(self.profile.handicap_index), 12.3)

    def test_profile_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CurrentUserAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.client.force_authenticate(user=self.user)
        self.me_url = '/api/auth/me/'

    def test_get_current_user(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['username'], 'testuser')

    def test_current_user_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
