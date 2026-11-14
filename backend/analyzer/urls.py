from django.urls import path

from analyzer.views import (
    ResumeAnalysisHistoryDetailView,
    ResumeAnalysisHistoryListView,
    ResumeAnalysisView,
)


urlpatterns = [
    path("analyze/", ResumeAnalysisView.as_view(), name="analyze-resume"),
    path("history/", ResumeAnalysisHistoryListView.as_view(), name="analysis-history"),
    path("history/<int:pk>/", ResumeAnalysisHistoryDetailView.as_view(), name="analysis-history-detail"),
]
