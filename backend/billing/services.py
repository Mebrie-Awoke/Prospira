import os
import uuid
from decimal import Decimal, InvalidOperation

import httpx


class ChapaConfigurationError(Exception):
    pass


class ChapaProviderError(Exception):
    pass


def premium_amount():
    raw = os.getenv("CHAPA_PREMIUM_AMOUNT_ETB", "").strip()
    if not raw:
        return None
    try:
        amount = Decimal(raw).quantize(Decimal("0.01"))
    except InvalidOperation as error:
        raise ChapaConfigurationError("The premium subscription price is not configured correctly.") from error
    if amount <= 0:
        raise ChapaConfigurationError("The premium subscription price must be greater than zero.")
    return amount


def initialize_payment(*, user, first_name, last_name, email, amount, tx_ref):
    secret = os.getenv("CHAPA_SECRET_KEY", "").strip()
    site_url = os.getenv("SITE_URL", "").strip().rstrip("/")
    frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    if not secret or not site_url or not frontend_url:
        raise ChapaConfigurationError("Chapa payment settings are incomplete.")

    payload = {
        "amount": f"{amount:.2f}",
        "currency": "ETB",
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "tx_ref": tx_ref,
        "callback_url": f"{site_url}/api/billing/chapa/callback/",
        "return_url": f"{frontend_url}/billing?payment=returned",
        "customization": {
            "title": "Prospira Premium",
            "description": "30-day Prospira Premium subscription",
        },
    }
    try:
        response = httpx.post(
            "https://api.chapa.co/v1/transaction/initialize",
            json=payload,
            headers={"Authorization": f"Bearer {secret}"},
            timeout=20.0,
        )
        response.raise_for_status()
        data = response.json()
    except Exception as error:
        raise ChapaProviderError("Chapa could not initialize this payment. Please try again.") from error

    checkout_url = (data.get("data") or {}).get("checkout_url")
    if data.get("status") != "success" or not checkout_url:
        raise ChapaProviderError("Chapa did not return a valid checkout link.")
    return checkout_url


def verify_payment(tx_ref):
    secret = os.getenv("CHAPA_SECRET_KEY", "").strip()
    if not secret:
        raise ChapaConfigurationError("Chapa payment settings are incomplete.")
    try:
        response = httpx.get(
            f"https://api.chapa.co/v1/transaction/verify/{tx_ref}",
            headers={"Authorization": f"Bearer {secret}"},
            timeout=20.0,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception as error:
        raise ChapaProviderError("We could not verify the payment with Chapa.") from error

    if payload.get("status") != "success" or not isinstance(payload.get("data"), dict):
        raise ChapaProviderError("Chapa could not confirm this payment.")
    return payload["data"]


def new_transaction_reference():
    return f"prospira-{uuid.uuid4().hex}"
