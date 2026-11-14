from django.urls import path

from analyzer.views import (
    CoverLetterDetailView,
    CoverLetterGenerateView,
    CoverLetterListView,
    ResumeAnalysisHistoryDetailView,
    ResumeAnalysisHistoryListView,
    ResumeAnalysisView,
)


urlpatterns = [
    path("analyze/", ResumeAnalysisView.as_view(), name="analyze-resume"),
    path("history/", ResumeAnalysisHistoryListView.as_view(), name="analysis-history"),
    path("history/<int:pk>/", ResumeAnalysisHistoryDetailView.as_view(), name="analysis-history-detail"),
    path("cover-letters/generate/", CoverLetterGenerateView.as_view(), name="cover-letter-generate"),
    path("cover-letters/", CoverLetterListView.as_view(), name="cover-letter-list"),
    path("cover-letters/<int:pk>/", CoverLetterDetailView.as_view(), name="cover-letter-detail"),
]
