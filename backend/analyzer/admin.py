from django.contrib import admin

from analyzer.models import CoverLetter, ResumeAnalysis


@admin.register(ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "overall_score", "created_at")
    list_filter = ("created_at", "overall_score")
    search_fields = ("user__username", "summary")
    readonly_fields = ("user", "overall_score", "summary", "result", "created_at")



@admin.register(CoverLetter)
class CoverLetterAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "updated_at")
    search_fields = ("user__username", "title", "content")
    readonly_fields = ("user", "title", "content", "created_at", "updated_at")
