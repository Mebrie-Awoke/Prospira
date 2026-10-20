
from django.urls import path
from .views import (
    RegistrationAPIView,
    ResumeListCreateAPIView,
    ResumeDetailAPIView,
    ResumePhotoAPIView,
)

urlpatterns = [
    path("register/", RegistrationAPIView.as_view(), name="register"),
    path(
        "resumes/",
        ResumeListCreateAPIView.as_view(),
        name="resume-list-create",
    ),
    path(
        "resumes/<int:pk>/",
        ResumeDetailAPIView.as_view(),
        name="resume-detail",
    ),
    path(
        "resumes/<int:pk>/photo/",
        ResumePhotoAPIView.as_view(),
        name="resume-photo",
    ),
]
