from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import Profile

User = get_user_model()


class CustomUserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )

    def test_user_creation(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.username, 'testuser')
        self.assertTrue(self.user.check_password('TestPass123!'))
        self.assertFalse(self.user.email_verified)
        self.assertTrue(self.user.is_active)

    def test_user_string_representation(self):
        self.assertEqual(str(self.user), 'test@example.com')

    def test_email_is_unique(self):
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='test@example.com',
                username='testuser2',
                password='TestPass123!'
            )


class ProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.profile = Profile.objects.create(
            user=self.user,
            display_name='Test User',
            phone_number='555-1234',
            handicap_index=15.5,
            ghin_id='1234567'
        )

    def test_profile_creation(self):
        self.assertEqual(self.profile.user, self.user)
        self.assertEqual(self.profile.display_name, 'Test User')
        self.assertEqual(self.profile.phone_number, '555-1234')
        self.assertEqual(self.profile.handicap_index, 15.5)
        self.assertEqual(self.profile.ghin_id, '1234567')

    def test_profile_default_handicap(self):
        user2 = User.objects.create_user(
            email='test2@example.com',
            username='testuser2',
            password='TestPass123!'
        )
        profile = Profile.objects.create(user=user2)
        self.assertEqual(profile.handicap_index, 20.0)

    def test_profile_string_representation(self):
        self.assertEqual(str(self.profile), "test@example.com's Profile")

    def test_profile_optional_fields(self):
        user3 = User.objects.create_user(
            email='test3@example.com',
            username='testuser3',
            password='TestPass123!'
        )
        profile = Profile.objects.create(user=user3)
        self.assertEqual(profile.display_name, '')
        self.assertEqual(profile.phone_number, '')
        self.assertIsNone(profile.date_of_birth)
        self.assertFalse(profile.profile_picture)
