import os
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from urllib.parse import urlencode

from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from billing.models import PaymentTransaction, Subscription
from billing.serializers import CheckoutRequestSerializer
from billing.services import (
    ChapaConfigurationError,
    ChapaProviderError,
    initialize_payment,
    new_transaction_reference,
    premium_amount,
    verify_payment,
)


class SubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription, _ = Subscription.objects.get_or_create(user=request.user)
        active = subscription.is_premium_active()
        if subscription.plan == Subscription.Plan.PREMIUM and not active:
            subscription.plan = Subscription.Plan.FREE
            subscription.save(update_fields=["plan", "updated_at"])
        try:
            amount = premium_amount()
        except ChapaConfigurationError:
            amount = None
        return Response({
            "plan": subscription.plan,
            "premium_active": active,
            "current_period_end": subscription.current_period_end,
            "premium_amount_etb": str(amount) if amount is not None else None,
            "checkout_available": bool(
                amount is not None
                and os.getenv("CHAPA_SECRET_KEY")
                and os.getenv("SITE_URL")
                and os.getenv("FRONTEND_URL")
            ),
        })


class PremiumCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            amount = premium_amount()
            if amount is None:
                raise ChapaConfigurationError("The Premium subscription price has not been configured.")
            tx_ref = new_transaction_reference()
            transaction = PaymentTransaction.objects.create(
                user=request.user,
                tx_ref=tx_ref,
                amount=amount,
            )
            checkout_url = initialize_payment(
                user=request.user,
                first_name=serializer.validated_data["first_name"],
                last_name=serializer.validated_data["last_name"],
                email=serializer.validated_data["email"],
                amount=amount,
                tx_ref=tx_ref,
            )
        except ChapaConfigurationError as error:
            return Response({"detail": str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ChapaProviderError as error:
            if "transaction" in locals():
                transaction.status = PaymentTransaction.Status.FAILED
                transaction.save(update_fields=["status"])
            return Response({"detail": str(error)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"checkout_url": checkout_url}, status=status.HTTP_201_CREATED)


class ChapaCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        tx_ref = request.query_params.get("trx_ref") or request.query_params.get("tx_ref")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        if not tx_ref:
            return redirect(f"{frontend_url}/billing?payment=failed")

        try:
            transaction = PaymentTransaction.objects.get(tx_ref=tx_ref)
        except PaymentTransaction.DoesNotExist:
            return redirect(f"{frontend_url}/billing?payment=failed")

        if transaction.status == PaymentTransaction.Status.SUCCESS:
            return redirect(f"{frontend_url}/billing?payment=success")

        try:
            data = verify_payment(tx_ref)
            verified_amount = Decimal(str(data.get("amount"))).quantize(Decimal("0.01"))
        except (ChapaConfigurationError, ChapaProviderError, InvalidOperation, TypeError, ValueError):
            return redirect(f"{frontend_url}/billing?payment=pending")

        verified = (
            str(data.get("status", "")).lower() == "success"
            and str(data.get("tx_ref", "")) == transaction.tx_ref
            and str(data.get("currency", "")).upper() == transaction.currency
            and verified_amount == transaction.amount
        )
        if not verified:
            transaction.status = PaymentTransaction.Status.FAILED
            transaction.save(update_fields=["status"])
            return redirect(f"{frontend_url}/billing?payment=failed")

        now = timezone.now()
        transaction.status = PaymentTransaction.Status.SUCCESS
        transaction.provider_reference = str(data.get("reference", ""))[:120]
        transaction.verified_at = now
        transaction.save(update_fields=["status", "provider_reference", "verified_at"])

        subscription, _ = Subscription.objects.get_or_create(user=transaction.user)
        start = max(now, subscription.current_period_end or now)
        subscription.plan = Subscription.Plan.PREMIUM
        subscription.current_period_start = now
        subscription.current_period_end = start + timedelta(days=30)
        subscription.save(update_fields=[
            "plan", "current_period_start", "current_period_end", "updated_at"
        ])
        return redirect(f"{frontend_url}/billing?payment=success")
