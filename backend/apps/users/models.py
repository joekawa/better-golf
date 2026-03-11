from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.utils.models import BaseModel


class CustomUser(AbstractUser, BaseModel):
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class Profile(BaseModel):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    handicap_index = models.DecimalField(max_digits=4, decimal_places=1, default=20.0)
    ghin_id = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.user.email}'s Profile"


class HandicapHistory(BaseModel):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='handicap_history')
    handicap_index = models.DecimalField(max_digits=4, decimal_places=1)
    calculation_date = models.DateTimeField(auto_now_add=True)
    rounds_count = models.IntegerField()
    differentials_used = models.IntegerField()

    def __str__(self):
        return f"{self.user.email} - {self.handicap_index} on {self.calculation_date.date()}"

    class Meta:
        verbose_name_plural = "Handicap Histories"
        ordering = ['-calculation_date']
