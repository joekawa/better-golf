from django.db import models
from apps.utils.models import BaseModel
from apps.rounds.models import Round


class Stats(BaseModel):
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='stats')
    fairways_hit = models.IntegerField(default=0)
    greens_in_regulation = models.IntegerField(default=0)
    total_putts = models.IntegerField(default=0)
    eagles = models.IntegerField(default=0)
    birdies = models.IntegerField(default=0)
    pars = models.IntegerField(default=0)
    bogeys = models.IntegerField(default=0)
    double_bogeys = models.IntegerField(default=0)

    def __str__(self):
        return f"Stats for {self.round}"

    class Meta:
        verbose_name_plural = "Stats"
        ordering = ['-round__date']
