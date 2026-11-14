"""
URL configuration for the Prospira API.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path
from django.views.decorators.http import require_safe
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


@require_safe
def health_check(request):
    try:
        connection.ensure_connection()
    except Exception:
        return JsonResponse({"status": "unavailable"}, status=503)

    return JsonResponse({
        "status": "ok",
        "service": "Prospira API",
    })


urlpatterns = [
    path("", health_check, name="root-health-check"),
    path("api/health/", health_check, name="health-check"),
    path("admin/", admin.site.urls),
    path("api/", include("resumes.urls")),
    path("api/account/", include("accounts.urls")),
    path("api/analyzer/", include("analyzer.urls")),
    path("api/billing/", include("billing.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
