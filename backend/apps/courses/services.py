import requests
import logging
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from .models import Course, CourseTee, Hole


logger = logging.getLogger(__name__)


class GolfCourseAPIService:
    """
    Service class for interacting with the Golf Course API
    API Documentation: https://api.golfcourseapi.com/docs/api/
    """

    _config_logged = False

    def __init__(self):
        self.api_key = settings.GOLF_COURSE_API_KEY
        self.base_url = settings.GOLF_COURSE_API_URL
        self.headers = {
            'Authorization': f'Key {self.api_key}'
        }

        if not GolfCourseAPIService._config_logged:
            api_key_hint = f"{self.api_key[:4]}***" if self.api_key else 'missing'
            logger.info(
                'GolfCourseAPIService initialized (api_key_present=%s, api_key_hint=%s, base_url=%s)',
                bool(self.api_key),
                api_key_hint,
                self.base_url,
            )
            GolfCourseAPIService._config_logged = True

    def search_courses(self, query, limit=20):
        """
        Search for golf courses using external API with database caching and fallback

        Args:
            query (str): Search query
            limit (int): Maximum number of results to return

        Returns:
            dict: {'source': 'api'|'cache', 'results': [...]}
        """
        try:
            endpoint = f"{self.base_url}/v1/search"
            params = {'search_query': query}

            response = requests.get(endpoint, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            courses = data.get('courses', [])

            cached_courses = self._cache_courses(courses)

            return {
                'source': 'api',
                'results': self._format_courses_for_response(cached_courses),
                'fallback_reason': None,
                'api_status_code': response.status_code,
                'message': None,
            }

        except requests.exceptions.Timeout as e:
            logger.warning('Course API search timed out for query="%s": %s', query, str(e))
            return self._search_local_database(
                query,
                limit,
                fallback_reason='api_timeout',
                message='External course API timed out. Showing cached results.',
            )
        except requests.exceptions.ConnectionError as e:
            logger.warning('Course API search connection error for query="%s": %s', query, str(e))
            return self._search_local_database(
                query,
                limit,
                fallback_reason='api_unreachable',
                message='External course API is unreachable. Showing cached results.',
            )
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response is not None else None
            fallback_reason = 'api_unauthorized' if status_code in (401, 403) else 'api_error'
            message = (
                'External course API authentication failed. Showing cached results.'
                if fallback_reason == 'api_unauthorized'
                else 'External course API returned an error. Showing cached results.'
            )
            logger.warning(
                'Course API search HTTP error for query="%s" (status=%s): %s',
                query,
                status_code,
                str(e),
            )
            return self._search_local_database(
                query,
                limit,
                fallback_reason=fallback_reason,
                api_status_code=status_code,
                message=message,
            )
        except requests.exceptions.RequestException as e:
            logger.warning('Course API search request exception for query="%s": %s', query, str(e))
            return self._search_local_database(
                query,
                limit,
                fallback_reason='api_error',
                message='External course API request failed. Showing cached results.',
            )

    def _search_local_database(
        self,
        query,
        limit=20,
        fallback_reason='api_unavailable',
        api_status_code=None,
        message='Showing cached results.',
    ):
        """
        Search local database for courses

        Args:
            query (str): Search query
            limit (int): Maximum number of results

        Returns:
            dict: {'source': 'cache', 'results': [...]}
        """
        courses = Course.objects.filter(
            Q(name__icontains=query) |
            Q(city__icontains=query) |
            Q(state__icontains=query)
        )[:limit]

        return {
            'source': 'cache',
            'results': self._format_courses_for_response(courses),
            'fallback_reason': fallback_reason,
            'api_status_code': api_status_code,
            'message': message,
        }

    def _cache_courses(self, api_courses):
        """
        Cache API courses in local database

        Args:
            api_courses (list): List of course data from API

        Returns:
            list: List of Course model instances
        """
        cached = []
        for course_data in api_courses:
            location = course_data.get('location', {})

            course, created = Course.objects.update_or_create(
                external_api_id=course_data.get('id'),
                defaults={
                    'name': course_data.get('course_name') or course_data.get('club_name', ''),
                    'city': location.get('city', ''),
                    'state': location.get('state', ''),
                    'address': location.get('address', ''),
                    'country': location.get('country', 'United States'),
                    'last_synced': timezone.now()
                }
            )
            cached.append(course)

        return cached

    def _format_courses_for_response(self, courses):
        """
        Format courses for API response

        Args:
            courses: QuerySet or list of Course instances

        Returns:
            list: Formatted course data
        """
        return [{
            'id': course.id,
            'external_api_id': course.external_api_id,
            'name': course.name,
            'city': course.city,
            'state': course.state,
            'country': course.country,
            'address': course.address
        } for course in courses]

    def get_course_details(self, course_id):
        """
        Get detailed information about a specific course from external API

        Args:
            course_id (int): External API course ID

        Returns:
            dict: Course details including tees and holes
        """
        try:
            endpoint = f"{self.base_url}/v1/courses/{course_id}"
            print(f"Fetching course details from: {endpoint}")

            response = requests.get(endpoint, headers=self.headers, timeout=10)
            print(f"API Response Status: {response.status_code}")
            response.raise_for_status()

            data = response.json()
            print(f"API Response Data Keys: {data.keys() if data else 'None'}")
            print(f"Course Data: {data}")

            return data

        except requests.exceptions.RequestException as e:
            print(f"Error getting course details: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response content: {e.response.text}")
            return None

    def save_course_to_db(self, api_course_data):
        """
        Save complete course data from API to local database including tees and holes

        Args:
            api_course_data (dict): Course data from API

        Returns:
            Course: Created or updated Course instance
        """
        print(f"Saving course to DB. API data keys: {api_course_data.keys() if api_course_data else 'None'}")

        course_data = api_course_data.get('course', api_course_data)
        print(f"Unwrapped course data keys: {course_data.keys() if course_data else 'None'}")

        location = course_data.get('location', {})

        course, created = Course.objects.update_or_create(
            external_api_id=course_data.get('id'),
            defaults={
                'name': course_data.get('course_name') or course_data.get('club_name', ''),
                'city': location.get('city', ''),
                'state': location.get('state', ''),
                'address': location.get('address', ''),
                'country': location.get('country', 'United States'),
                'last_synced': timezone.now()
            }
        )
        print(f"Course {'created' if created else 'updated'}: {course.name} (ID: {course.id})")

        tees_data = course_data.get('tees', {})
        print(f"Tees data from API: {tees_data}")
        all_tees = tees_data.get('male', []) + tees_data.get('female', [])
        print(f"Total tees to process: {len(all_tees)}")

        for tee_data in all_tees:
            tee, tee_created = CourseTee.objects.update_or_create(
                course=course,
                name=tee_data.get('tee_name', 'Championship'),
                defaults={
                    'slope': tee_data.get('slope_rating', 113),
                    'rating': tee_data.get('course_rating', 72.0),
                    'par': tee_data.get('par_total', 72),
                    'handicap': tee_data.get('handicap'),
                }
            )

            holes_data = tee_data.get('holes', [])
            for index, hole_data in enumerate(holes_data, start=1):
                Hole.objects.update_or_create(
                    course=course,
                    course_tee=tee,
                    hole_number=index,
                    defaults={
                        'par': hole_data.get('par', 4),
                        'distance': hole_data.get('yardage', 400),
                    }
                )

        return course
