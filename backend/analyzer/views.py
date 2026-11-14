from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from analyzer.history_serializers import (\n    CoverLetterRequestSerializer,\n    CoverLetterSerializer,\n    ResumeAnalysisHistorySerializer,\n)
from analyzer.models import CoverLetter, ResumeAnalysis
from analyzer.serializers import (
    ResumeAnalysisRequestSerializer,
    ResumeAnalysisResponseSerializer,
)
from analyzer.services import (
    AnalyzerConfigurationError,
    AnalyzerProviderError,
    AnalyzerRateLimitError,
    AnalyzerResponseError,
    ResumeExtractionError,
    analyze_resume,
    extract_resume_text,
)


class ResumeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "analyzer"

    def post(self, request):
        serializer = ResumeAnalysisRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data

        try:
            resume_text = (
                extract_resume_text(values["resume_file"])
                if values.get("resume_file")
                else values["resume_text"]
            )
            result = analyze_resume(
                resume_text=resume_text,
                job_description=values["job_description"],
            )
        except ResumeExtractionError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        except AnalyzerConfigurationError as error:
            return Response({"detail": str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except AnalyzerRateLimitError as error:
            return Response({"detail": str(error)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except AnalyzerProviderError as error:
            return Response({"detail": str(error)}, status=status.HTTP_502_BAD_GATEWAY)
        except AnalyzerResponseError as error:
            return Response({"detail": str(error)}, status=status.HTTP_502_BAD_GATEWAY)

        response_serializer = ResumeAnalysisResponseSerializer(data=result)
        try:
            response_serializer.is_valid(raise_exception=True)
        except serializers.ValidationError:
            return Response(
                {"detail": "The analysis provider returned an invalid result."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Keep only the structured feedback. Uploaded files, extracted resume
        # text, and job descriptions are intentionally never persisted.
        saved = ResumeAnalysis.objects.create(
            user=request.user,
            overall_score=response_serializer.validated_data["overall_score"],
            summary=response_serializer.validated_data["summary"],
            result=response_serializer.data,
        )
        payload = dict(response_serializer.data)
        payload.update({"id": saved.pk, "created_at": saved.created_at})
        return Response(payload, status=status.HTTP_200_OK)


class ResumeAnalysisHistoryListView(generics.ListAPIView):
    serializer_class = ResumeAnalysisHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ResumeAnalysis.objects.filter(user=self.request.user)


class ResumeAnalysisHistoryDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ResumeAnalysisHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ResumeAnalysis.objects.filter(user=self.request.user)



class CoverLetterGenerateView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "analyzer"

    def post(self, request):
        request_serializer = CoverLetterRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        values = request_serializer.validated_data
        try:
            letter = generate_cover_letter(
                resume_text=values["resume_text"],
                job_description=values["job_description"],
                tone=values["tone"],
            )
        except AnalyzerConfigurationError as error:
            return Response({"detail": str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except AnalyzerRateLimitError as error:
            return Response({"detail": str(error)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except AnalyzerProviderError as error:
            return Response({"detail": str(error)}, status=status.HTTP_502_BAD_GATEWAY)
        except AnalyzerResponseError as error:
            return Response({"detail": str(error)}, status=status.HTTP_502_BAD_GATEWAY)

        saved = CoverLetter.objects.create(
            user=request.user,
            title=values.get("title", "").strip() or "Cover letter",
            content=letter,
        )
        return Response(CoverLetterSerializer(saved).data, status=status.HTTP_201_CREATED)


class CoverLetterListView(generics.ListAPIView):
    serializer_class = CoverLetterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CoverLetter.objects.filter(user=self.request.user)


class CoverLetterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CoverLetterSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return CoverLetter.objects.filter(user=self.request.user)
