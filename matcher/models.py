from django.db import models


class UserInput(models.Model):
    subject_area = models.CharField(max_length=100)
    level = models.CharField(max_length=50)
    study_mode = models.CharField(max_length=50)
    interests = models.TextField()
    skill_sets = models.TextField()
    learning_style = models.TextField()
    location_preference = models.CharField(max_length=100, blank=True, null=True)
    search_globally = models.BooleanField(default=False)
    search_low_cost = models.BooleanField(default=False)
    specific_interests = models.TextField(blank=True, null=True)

class Course(models.Model):
    title = models.CharField(max_length=255)
    subject_area = models.CharField(max_length=100)
    level = models.CharField(max_length=50)
    study_modes = models.CharField(max_length=255)
    location = models.CharField(max_length=100)
    tuition_fee = models.FloatField()
    living_cost = models.FloatField()
    funding_options = models.TextField()
    ranking = models.IntegerField()
    course_url = models.URLField()
    learning_style = models.TextField()
