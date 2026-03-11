from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Profile


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'is_active', 'email_verified', 'last_login', 'date_joined']
    list_filter = ['is_active', 'email_verified', 'is_staff', 'is_superuser']
    search_fields = ['email', 'username']
    ordering = ['-date_joined']

    fieldsets = UserAdmin.fieldsets + (
        ('Email Verification', {'fields': ('email_verified',)}),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'display_name', 'handicap_index', 'ghin_id', 'city', 'state', 'created_at']
    list_filter = ['state', 'country']
    search_fields = ['user__email', 'display_name', 'ghin_id']
    ordering = ['-created_at']
