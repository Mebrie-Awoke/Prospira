from django.urls import path

from analyzer.views import ResumeAnalysisView


urlpatterns = [
    path("analyze/", ResumeAnalysisView.as_view(), name="analyze-resume"),
]
