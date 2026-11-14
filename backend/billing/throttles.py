from rest_framework.throttling import SimpleRateThrottle


class SubscriptionAwareAIThrottle(SimpleRateThrottle):
    """Give premium accounts a higher AI request allowance."""

    scope = "prospira_ai"

    def get_rate(self):
        return "10/hour"

    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return None
        return self.cache_format % {"scope": self.scope, "ident": request.user.pk}

    def allow_request(self, request, view):
        rate = "10/hour"
        if request.user and request.user.is_authenticated:
            try:
                subscription = request.user.subscription
                if subscription.is_premium_active():
                    rate = "100/hour"
            except Exception:
                pass
        self.rate = rate
        self.num_requests, self.duration = self.parse_rate(rate)
        return super().allow_request(request, view)
