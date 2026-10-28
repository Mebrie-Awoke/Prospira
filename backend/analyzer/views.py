from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from analyzer.serializers import (
    ResumeAnalysisRequestSerializer,
    ResumeAnalysisResponseSerializer,
)
from analyzer.services import (
    AnalyzerConfigurationError,
    AnalyzerProviderError,
    AnalyzerRateLimitError,
    AnalyzerResponseError,
    analyze_resume,
)


class ResumeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "analyzer"

    def post(self, request):
        serializer = ResumeAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = analyze_resume(**serializer.validated_data)
        except AnalyzerConfigurationError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except AnalyzerRateLimitError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except AnalyzerProviderError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except AnalyzerResponseError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        response_serializer = ResumeAnalysisResponseSerializer(data=result)
        try:
            response_serializer.is_valid(raise_exception=True)
        except serializers.ValidationError:
            return Response(
                {"detail": "The analysis provider returned an invalid result."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(response_serializer.data, status=status.HTTP_200_OK)
