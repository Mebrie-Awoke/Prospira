
from django.db import models
from django.conf import settings


class Resume(models.Model):
    TEMPLATE_CHOICES = (
        ("classic", "Classic Professional"),
        ("modern-blue", "Modern Blue"),
        ("minimalist", "Minimalist"),
        ("executive", "Executive"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resumes",
        null=True,
        blank=True,
    )
    resume_title = models.CharField(max_length=180, blank=True)
    template_identifier = models.CharField(
        max_length=32, choices=TEMPLATE_CHOICES, default="classic"
    )
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    location = models.CharField(max_length=180, blank=True)
    professional_title = models.CharField(max_length=180, blank=True)
    links = models.JSONField(default=list, blank=True)
    professional_summary = models.TextField(blank=True)
    education = models.TextField(blank=True)
    experience = models.TextField(blank=True)
    skills = models.TextField(blank=True)
    education_entries = models.JSONField(default=list, blank=True)
    experience_entries = models.JSONField(default=list, blank=True)
    skills_list = models.JSONField(default=list, blank=True)
    projects = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    profile_photo = models.ImageField(
        upload_to="resume_photos/",
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.resume_title or self.full_name
