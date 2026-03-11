from django.contrib import admin
from .models import ScoreType, Round, RoundScore, HoleScore


@admin.register(ScoreType)
class ScoreTypeAdmin(admin.ModelAdmin):
    list_display = ['type', 'created_at']
    list_filter = ['type']


@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'course_tee', 'score_type', 'date', 'created_at']
    list_filter = ['score_type', 'date', 'course']
    search_fields = ['user__email', 'course__name']
    date_hierarchy = 'date'


@admin.register(RoundScore)
class RoundScoreAdmin(admin.ModelAdmin):
    list_display = ['round', 'gross_score', 'net_score', 'created_at']
    search_fields = ['round__user__email', 'round__course__name']


@admin.register(HoleScore)
class HoleScoreAdmin(admin.ModelAdmin):
    list_display = ['round', 'hole', 'score', 'created_at']
    list_filter = ['round__course']
    search_fields = ['round__user__email', 'hole__course__name']
