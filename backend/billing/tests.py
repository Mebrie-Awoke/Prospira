import os
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from billing.models import PaymentTransaction, Subscription


class BillingStatusTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="billing-user",
            email="billing@example.com",
            password="test-password",
        )
        self.client.force_authenticate(self.user)

    @patch.dict(os.environ, {"CHAPA_SECRET_KEY": "", "CHAPA_PREMIUM_AMOUNT_ETB": "", "SITE_URL": "", "FRONTEND_URL": ""})
    def test_new_account_starts_on_free_plan_and_checkout_is_unavailable_until_configured(self):
        response = self.client.get(reverse("subscription-status"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["plan"], "free")
        self.assertFalse(response.data["checkout_available"])

    @patch.dict(os.environ, {"CHAPA_SECRET_KEY": "", "CHAPA_PREMIUM_AMOUNT_ETB": ""})
    def test_checkout_is_disabled_when_payment_configuration_is_missing(self):
        response = self.client.post(
            reverse("premium-checkout"),
            {"first_name": "Mebrie", "last_name": "Awoke", "email": "mebrie@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class ChapaCallbackTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="payment-owner",
            email="payment@example.com",
            password="test-password",
        )
        self.client.force_authenticate(self.user)
        self.transaction = PaymentTransaction.objects.create(
            user=self.user,
            tx_ref="prospira-test-payment",
            amount=Decimal("299.00"),
        )

    @patch("billing.views.verify_payment")
    @patch.dict(os.environ, {"FRONTEND_URL": "https://prospira.example"})
    def test_successful_verified_payment_activates_premium(self, verify_mock):
        verify_mock.return_value = {
            "status": "success",
            "tx_ref": self.transaction.tx_ref,
            "currency": "ETB",
            "amount": "299.00",
            "reference": "chapa-reference",
        }
        response = self.client.get(
            reverse("chapa-callback"),
            {"trx_ref": self.transaction.tx_ref},
        )
        self.assertEqual(response.status_code, 302)
        self.assertIn("payment=success", response["Location"])
        subscription = Subscription.objects.get(user=self.user)
        self.assertEqual(subscription.plan, Subscription.Plan.PREMIUM)
        self.assertGreater(subscription.current_period_end, timezone.now())
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.status, PaymentTransaction.Status.SUCCESS)

    @patch("billing.views.verify_payment")
    @patch.dict(os.environ, {"FRONTEND_URL": "https://prospira.example"})
    def test_wrong_amount_does_not_activate_premium(self, verify_mock):
        verify_mock.return_value = {
            "status": "success",
            "tx_ref": self.transaction.tx_ref,
            "currency": "ETB",
            "amount": "1.00",
            "reference": "tampered-reference",
        }
        response = self.client.get(
            reverse("chapa-callback"),
            {"trx_ref": self.transaction.tx_ref},
        )
        self.assertIn("payment=failed", response["Location"])
        self.assertFalse(Subscription.objects.filter(
            user=self.user, plan=Subscription.Plan.PREMIUM
        ).exists())

    @patch("billing.views.verify_payment")
    @patch.dict(os.environ, {"FRONTEND_URL": "https://prospira.example"})
    def test_repeated_success_callback_does_not_extend_subscription_twice(self, verify_mock):
        verify_mock.return_value = {
            "status": "success",
            "tx_ref": self.transaction.tx_ref,
            "currency": "ETB",
            "amount": "299.00",
            "reference": "chapa-reference",
        }
        callback = reverse("chapa-callback")
        self.client.get(callback, {"trx_ref": self.transaction.tx_ref})
        end_date = Subscription.objects.get(user=self.user).current_period_end
        self.client.get(callback, {"trx_ref": self.transaction.tx_ref})
        self.assertEqual(Subscription.objects.get(user=self.user).current_period_end, end_date)
        verify_mock.assert_called_once()


    @patch("billing.services.httpx.post")
    @patch.dict(os.environ, {
        "CHAPA_SECRET_KEY": "CHASECK_TEST-example",
        "CHAPA_PREMIUM_AMOUNT_ETB": "299.00",
        "SITE_URL": "https://prospira-api.onrender.com",
        "FRONTEND_URL": "https://prospira.vercel.app",
    })
    def test_checkout_initializes_chapa_and_records_pending_transaction(self, post_mock):
        self.client.force_authenticate(user=self.user)
        response_from_provider = post_mock.return_value
        response_from_provider.raise_for_status.return_value = None
        response_from_provider.json.return_value = {
            "status": "success",
            "data": {"checkout_url": "https://checkout.chapa.co/example"},
        }

        response = self.client.post(
            reverse("premium-checkout"),
            {"first_name": "Mebrie", "last_name": "Awoke", "email": "mebrie@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["checkout_url"], "https://checkout.chapa.co/example")
        transaction = PaymentTransaction.objects.exclude(pk=self.transaction.pk).get(user=self.user)
        self.assertEqual(transaction.amount, Decimal("299.00"))
        self.assertEqual(transaction.status, PaymentTransaction.Status.PENDING)
        payload = post_mock.call_args.kwargs["json"]
        self.assertEqual(payload["currency"], "ETB")
        self.assertEqual(payload["callback_url"], "https://prospira-api.onrender.com/api/billing/chapa/callback/")
        self.assertEqual(post_mock.call_args.kwargs["headers"]["Authorization"], "Bearer CHASECK_TEST-example")
