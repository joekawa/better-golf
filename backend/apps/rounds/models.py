from django.db import models
from apps.utils.models import BaseModel
from apps.users.models import CustomUser
from apps.courses.models import Course, CourseTee, Hole


class ScoreType(BaseModel):
    TOTAL = 0
    HOLE_BY_HOLE = 1

    TYPE_CHOICES = [
        (TOTAL, 'Total Score'),
        (HOLE_BY_HOLE, 'Hole-by-Hole'),
    ]

    type = models.IntegerField(choices=TYPE_CHOICES, default=HOLE_BY_HOLE)

    def __str__(self):
        return self.get_type_display()

    class Meta:
        ordering = ['type']


class Round(BaseModel):
    FULL_18 = 'full_18'
    FRONT_9 = 'front_9'
    BACK_9 = 'back_9'

    SEGMENT_CHOICES = [
        (FULL_18, '18 Holes'),
        (FRONT_9, 'Front 9'),
        (BACK_9, 'Back 9'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='rounds')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='rounds')
    course_tee = models.ForeignKey(CourseTee, on_delete=models.CASCADE, related_name='rounds')
    score_type = models.ForeignKey(ScoreType, on_delete=models.CASCADE, related_name='rounds')
    date = models.DateField()
    holes_played = models.IntegerField(default=18)
    hole_segment = models.CharField(max_length=10, choices=SEGMENT_CHOICES, default=FULL_18)

    def __str__(self):
        return f"{self.user.email} - {self.course.name} - {self.date}"

    @property
    def expected_hole_numbers(self):
        if self.hole_segment == self.FRONT_9:
            return list(range(1, 10))
        elif self.hole_segment == self.BACK_9:
            return list(range(10, 19))
        return list(range(1, 19))

    @property
    def expected_hole_count(self):
        return self.holes_played

    class Meta:
        ordering = ['-date']


class RoundScore(BaseModel):
    round = models.OneToOneField(Round, on_delete=models.CASCADE, related_name='score')
    net_score = models.IntegerField()
    gross_score = models.IntegerField()

    def __str__(self):
        return f"{self.round} - Gross: {self.gross_score}, Net: {self.net_score}"

    class Meta:
        ordering = ['-round__date']


class HoleScore(BaseModel):
    hole = models.ForeignKey(Hole, on_delete=models.CASCADE, related_name='scores')
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='hole_scores')
    score = models.IntegerField()
    putts = models.IntegerField(default=0)
    fairway_hit = models.BooleanField(default=False)
    gir = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.round} - Hole {self.hole.hole_number}: {self.score}"

    class Meta:
        ordering = ['round', 'hole__hole_number']
        unique_together = ['hole', 'round']
