from django.conf import settings
from django.db import models


class ResumeAnalysis(models.Model):
    """Privacy-conscious saved feedback; source resume text and job descriptions are not retained."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resume_analyses",
    )
    overall_score = models.PositiveSmallIntegerField()
    summary = models.CharField(max_length=2000)
    result = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-pk"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="analysis_user_created_idx"),
        ]

    def __str__(self):
        return f"Resume analysis ({self.overall_score}/100) for {self.user}"
