from django.urls import path

from billing.views import ChapaCallbackView, PremiumCheckoutView, SubscriptionStatusView


urlpatterns = [
    path("subscription/", SubscriptionStatusView.as_view(), name="subscription-status"),
    path("checkout/", PremiumCheckoutView.as_view(), name="premium-checkout"),
    path("chapa/callback/", ChapaCallbackView.as_view(), name="chapa-callback"),
]
