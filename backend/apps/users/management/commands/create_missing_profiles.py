from django.core.management.base import BaseCommand
from apps.users.models import CustomUser, Profile


class Command(BaseCommand):
    help = 'Create missing profiles for users'

    def handle(self, *args, **options):
        users_without_profiles = CustomUser.objects.filter(profile__isnull=True)
        count = 0
        
        for user in users_without_profiles:
            Profile.objects.create(user=user)
            count += 1
            self.stdout.write(self.style.SUCCESS(f'Created profile for user: {user.email}'))
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('All users already have profiles'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Created {count} profile(s)'))
