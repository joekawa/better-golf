from django.core import signing
from django.core.mail import send_mail
from django.conf import settings


VERIFICATION_TOKEN_MAX_AGE = 86400  # 24 hours
PASSWORD_RESET_TOKEN_MAX_AGE = 3600  # 1 hour


def generate_verification_token(user):
    return signing.dumps({'user_id': user.pk}, salt='email-verification')


def verify_token(token):
    try:
        data = signing.loads(token, salt='email-verification', max_age=VERIFICATION_TOKEN_MAX_AGE)
        return data.get('user_id'), None
    except signing.SignatureExpired:
        return None, 'expired'
    except signing.BadSignature:
        return None, 'invalid'


def send_verification_email(user, request=None):
    token = generate_verification_token(user)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verification_url = f"{frontend_url}/verify-email?token={token}"

    subject = "Verify your Grip Golf email address"
    message = (
        f"Hi,\n\n"
        f"Thanks for signing up for Grip Golf. Please verify your email address by clicking the link below:\n\n"
        f"{verification_url}\n\n"
        f"This link expires in 24 hours.\n\n"
        f"If you did not create an account, you can ignore this email.\n\n"
        f"— The Grip Golf Team"
    )

    print(f"[EMAIL] Sending verification email to {user.email}")

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def generate_password_reset_token(user):
    return signing.dumps({'user_id': user.pk}, salt='password-reset')


def verify_password_reset_token(token):
    try:
        data = signing.loads(token, salt='password-reset', max_age=PASSWORD_RESET_TOKEN_MAX_AGE)
        return data.get('user_id'), None
    except signing.SignatureExpired:
        return None, 'expired'
    except signing.BadSignature:
        return None, 'invalid'


def send_password_reset_email(user, request=None):
    token = generate_password_reset_token(user)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url}/reset-password?token={token}"

    subject = "Reset your Grip Golf password"
    message = (
        f"Hi,\n\n"
        f"We received a request to reset your Grip Golf password. Click the link below to set a new password:\n\n"
        f"{reset_url}\n\n"
        f"This link expires in 1 hour.\n\n"
        f"If you did not request a password reset, you can ignore this email.\n\n"
        f"— The Grip Golf Team"
    )

    print(f"[EMAIL] Sending password reset email to {user.email}")

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
