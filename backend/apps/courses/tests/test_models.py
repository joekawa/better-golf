from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.courses.models import Course, Tee, Hole

User = get_user_model()


class CourseModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.course = Course.objects.create(
            name='Test Golf Course',
            city='Test City',
            state='CA',
            country='USA',
            created_by=self.user
        )

    def test_course_creation(self):
        self.assertEqual(self.course.name, 'Test Golf Course')
        self.assertEqual(self.course.city, 'Test City')
        self.assertEqual(self.course.state, 'CA')
        self.assertEqual(self.course.country, 'USA')
        self.assertEqual(self.course.created_by, self.user)

    def test_course_string_representation(self):
        self.assertEqual(str(self.course), 'Test Golf Course - Test City, CA')

    def test_course_optional_fields(self):
        course = Course.objects.create(
            name='Minimal Course',
            created_by=self.user
        )
        self.assertEqual(course.address, '')
        self.assertEqual(course.city, '')
        self.assertEqual(course.state, '')
        self.assertEqual(course.zip, '')
        self.assertEqual(course.country, '')


class TeeModelTest(TestCase):
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

    def test_tee_creation(self):
        self.assertEqual(self.tee.course, self.course)
        self.assertEqual(self.tee.name, 'Blue')
        self.assertEqual(self.tee.color, 'Blue')
        self.assertEqual(self.tee.rating, 72.5)
        self.assertEqual(self.tee.slope, 130)
        self.assertEqual(self.tee.par, 72)
        self.assertEqual(self.tee.yardage, 6800)

    def test_tee_string_representation(self):
        self.assertEqual(str(self.tee), 'Test Golf Course - Blue Tees')

    def test_tee_gender_field(self):
        tee = Tee.objects.create(
            course=self.course,
            name='Red',
            color='Red',
            rating=68.0,
            slope=115,
            par=72,
            yardage=5200,
            gender='F'
        )
        self.assertEqual(tee.gender, 'F')


class HoleModelTest(TestCase):
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

    def test_hole_creation(self):
        self.assertEqual(self.hole.tee, self.tee)
        self.assertEqual(self.hole.hole_number, 1)
        self.assertEqual(self.hole.par, 4)
        self.assertEqual(self.hole.yardage, 420)
        self.assertEqual(self.hole.handicap, 5)

    def test_hole_string_representation(self):
        self.assertEqual(str(self.hole), 'Test Golf Course - Blue Tees - Hole 1')

    def test_hole_ordering(self):
        hole2 = Hole.objects.create(
            tee=self.tee,
            hole_number=2,
            par=3,
            yardage=180,
            handicap=15
        )
        holes = list(Hole.objects.filter(tee=self.tee))
        self.assertEqual(holes[0], self.hole)
        self.assertEqual(holes[1], hole2)

    def test_hole_unique_constraint(self):
        with self.assertRaises(Exception):
            Hole.objects.create(
                tee=self.tee,
                hole_number=1,
                par=4,
                yardage=420,
                handicap=5
            )
