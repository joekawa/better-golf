from django.db import models
from apps.utils.models import BaseModel


class Course(BaseModel):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    address = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=100)
    external_api_id = models.IntegerField(null=True, blank=True, db_index=True)
    last_synced = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.city}, {self.state}"

    class Meta:
        ordering = ['name']


class CourseTee(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='tees')
    name = models.CharField(max_length=100)
    slope = models.DecimalField(max_digits=5, decimal_places=1)
    rating = models.DecimalField(max_digits=4, decimal_places=1)
    par = models.IntegerField()
    handicap = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.course.name} - {self.name} Tees"

    class Meta:
        ordering = ['course', 'name']


class Hole(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='holes')
    course_tee = models.ForeignKey(CourseTee, on_delete=models.CASCADE, related_name='holes')
    hole_number = models.IntegerField()
    par = models.IntegerField()
    distance = models.IntegerField()

    def __str__(self):
        return f"{self.course.name} - Hole {self.hole_number}"

    class Meta:
        ordering = ['course', 'course_tee', 'hole_number']
        unique_together = ['course', 'course_tee', 'hole_number']
