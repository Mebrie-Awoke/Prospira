from django.contrib import admin

from billing.models import PaymentTransaction, Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "current_period_end", "updated_at")
    list_filter = ("plan",)
    search_fields = ("user__username", "user__email")


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ("tx_ref", "user", "amount", "currency", "status", "created_at")
    list_filter = ("status", "currency", "created_at")
    search_fields = ("tx_ref", "provider_reference", "user__username")
    readonly_fields = ("user", "tx_ref", "amount", "currency", "status", "provider_reference", "created_at", "verified_at")
