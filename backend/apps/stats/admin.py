from django.contrib import admin
from .models import Stats


@admin.register(Stats)
class StatsAdmin(admin.ModelAdmin):
    list_display = ['round', 'fairways_hit', 'greens_in_regulation', 'total_putts',
                    'eagles', 'birdies', 'pars', 'bogeys', 'double_bogeys', 'created_at']
    list_filter = ['round__course', 'round__date']
    search_fields = ['round__user__email', 'round__course__name']
    date_hierarchy = 'round__date'
