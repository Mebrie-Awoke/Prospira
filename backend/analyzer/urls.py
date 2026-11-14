from django.urls import path

from analyzer.views import (
    ResumeAnalysisHistoryDetailView,
    ResumeAnalysisHistoryListView,\n    CoverLetterGenerateView,\n    CoverLetterListView,\n    CoverLetterDetailView,
    ResumeAnalysisView,
)


urlpatterns = [
    path("analyze/", ResumeAnalysisView.as_view(), name="analyze-resume"),
    path("history/", ResumeAnalysisHistoryListView.as_view(), name="analysis-history"),
    path("history/<int:pk>/", ResumeAnalysisHistoryDetailView.as_view(), name="analysis-history-detail"),\n    path("cover-letters/generate/", CoverLetterGenerateView.as_view(), name="cover-letter-generate"),\n    path("cover-letters/", CoverLetterListView.as_view(), name="cover-letter-list"),\n    path("cover-letters/<int:pk>/", CoverLetterDetailView.as_view(), name="cover-letter-detail"),
]
