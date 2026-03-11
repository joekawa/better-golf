from rest_framework import generics, status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .models import CustomUser, Profile, HandicapHistory
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
    HandicapHistorySerializer
)


class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class UserLoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class UserLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CurrentUserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            profile = request.user.profile
            serializer = ProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user

            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'old_password': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data['new_password'])
            user.save()

            return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HandicapHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HandicapHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HandicapHistory.objects.filter(user=self.request.user).order_by('-calculation_date')

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current (most recent) handicap index"""
        latest = self.get_queryset().first()
        if latest:
            serializer = self.get_serializer(latest)
            return Response(serializer.data)
        return Response({'detail': 'No handicap history found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Preview what handicap would be with a new round.

        POST body:
        {
            "gross_score": 85,
            "course_tee_id": 123
        }

        Returns:
        {
            "current_handicap": 12.3,
            "pending_handicap": 11.8,
            "rounds_count": 10,
            "will_have_handicap": true
        }
        """
        from apps.users.services import HandicapCalculationService
        from apps.courses.models import CourseTee

        gross_score = request.data.get('gross_score')
        course_tee_id = request.data.get('course_tee_id')

        if not gross_score or not course_tee_id:
            return Response(
                {'error': 'gross_score and course_tee_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            gross_score = int(gross_score)
            course_tee = CourseTee.objects.get(id=course_tee_id)
        except (ValueError, CourseTee.DoesNotExist) as e:
            return Response(
                {'error': 'Invalid gross_score or course_tee_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = HandicapCalculationService.preview_handicap_with_round(
            request.user,
            gross_score,
            course_tee
        )

        return Response(result)
