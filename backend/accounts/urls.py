from django.urls import path

from .views import PasswordChangeAPIView, UserProfileAPIView


urlpatterns = [
    path("profile/", UserProfileAPIView.as_view(), name="account-profile"),
    path("password/", PasswordChangeAPIView.as_view(), name="account-password"),
]
