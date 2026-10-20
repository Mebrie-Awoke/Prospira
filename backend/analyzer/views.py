from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analyzer.serializers import ResumeAnalysisRequestSerializer
from analyzer.services import (
    AnalyzerConfigurationError,
    AnalyzerProviderError,
    AnalyzerResponseError,
    analyze_resume,
)


class ResumeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

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

        return Response(result, status=status.HTTP_200_OK)
