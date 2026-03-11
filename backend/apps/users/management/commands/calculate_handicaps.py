from django.core.management.base import BaseCommand
from apps.users.models import CustomUser
from apps.users.services import HandicapCalculationService


class Command(BaseCommand):
    help = 'Calculate handicap indices for all users with sufficient rounds'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Calculate handicap for a specific user ID only',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Recalculate even if handicap history already exists',
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        force = options.get('force', False)

        if user_id:
            users = CustomUser.objects.filter(id=user_id)
            if not users.exists():
                self.stdout.write(self.style.ERROR(f'User with ID {user_id} not found'))
                return
        else:
            users = CustomUser.objects.all()

        total_users = users.count()
        updated_count = 0
        skipped_count = 0
        insufficient_rounds_count = 0

        self.stdout.write(f'Processing {total_users} user(s)...\n')

        for user in users:
            # Check if user already has handicap history
            if not force and user.handicap_history.exists():
                self.stdout.write(f'Skipping {user.email} - already has handicap history (use --force to recalculate)')
                skipped_count += 1
                continue

            # Calculate handicap
            try:
                handicap = HandicapCalculationService.update_user_handicap(user)
                if handicap is not None:
                    self.stdout.write(self.style.SUCCESS(
                        f'✓ Updated {user.email}: Handicap Index = {handicap}'
                    ))
                    updated_count += 1
                else:
                    self.stdout.write(self.style.WARNING(
                        f'⚠ {user.email}: Not enough rounds (need 5+)'
                    ))
                    insufficient_rounds_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'✗ Error calculating handicap for {user.email}: {e}'
                ))

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'\nSummary:'))
        self.stdout.write(f'  Total users processed: {total_users}')
        self.stdout.write(self.style.SUCCESS(f'  Successfully updated: {updated_count}'))
        self.stdout.write(self.style.WARNING(f'  Insufficient rounds: {insufficient_rounds_count}'))
        if not force:
            self.stdout.write(f'  Skipped (already have history): {skipped_count}')
        self.stdout.write('='*50 + '\n')
