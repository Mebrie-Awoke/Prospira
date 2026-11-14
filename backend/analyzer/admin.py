from django.contrib import admin

from analyzer.models import ResumeAnalysis


@admin.register(ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "overall_score", "created_at")
    list_filter = ("created_at", "overall_score")
    search_fields = ("user__username", "summary")
    readonly_fields = ("user", "overall_score", "summary", "result", "created_at")
