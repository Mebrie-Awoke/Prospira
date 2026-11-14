import json
import os
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import patch

import httpx
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from docx import Document
from groq import APITimeoutError, RateLimitError
from rest_framework import status
from rest_framework.test import APITestCase

from analyzer.services import (
    AnalyzerConfigurationError,
    AnalyzerProviderError,
    AnalyzerRateLimitError,
    AnalyzerResponseError,
    RESULT_FIELDS,
    analyze_resume,
    extract_resume_text,
    ResumeExtractionError,
)


def valid_analysis():
    return {
        "overall_score": 78,
        "summary": "The resume shows relevant experience and measurable outcomes.",
        "strengths": ["Includes measurable project outcomes."],
        "improvements": ["Clarify the scope of team leadership."],
        "skills_found": ["Python"],
        "missing_job_skills": ["Kubernetes"],
        "experience_feedback": "Several entries explain outcomes clearly.",
        "formatting_feedback": "The extracted text has clear section headings.",
        "recommendations": ["Add evidence for the required Kubernetes experience."],
    }


def completion_with(content):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )


class AnalyzerServiceTests(APITestCase):
    @patch("analyzer.services.Groq")
    def test_returns_validated_analysis_from_groq(self, groq_client):
        expected = valid_analysis()
        groq_client.return_value.chat.completions.create.return_value = (
            completion_with(json.dumps(expected))
        )

        with patch.dict(os.environ, {"GROQ_API_KEY": "unit-test-key"}):
            result = analyze_resume("Resume content", "Target job")

        self.assertEqual(result, expected)
        groq_client.assert_called_once()
        create_call = groq_client.return_value.chat.completions.create
        self.assertEqual(create_call.call_args.kwargs["model"], "openai/gpt-oss-120b")
        self.assertEqual(
            json.loads(create_call.call_args.kwargs["messages"][1]["content"]),
            {"resume_text": "Resume content", "job_description": "Target job"},
        )
        self.assertEqual(
            set(
                create_call.call_args.kwargs["response_format"]["json_schema"][
                    "schema"
                ]["required"]
            ),
            set(RESULT_FIELDS),
        )

    @patch("analyzer.services.Groq")
    def test_rejects_malformed_json(self, groq_client):
        groq_client.return_value.chat.completions.create.return_value = (
            completion_with("not json")
        )

        with patch.dict(os.environ, {"GROQ_API_KEY": "unit-test-key"}):
            with self.assertRaises(AnalyzerResponseError):
                analyze_resume("Resume content")

    @patch("analyzer.services.Groq")
    def test_rejects_out_of_range_score(self, groq_client):
        result = valid_analysis()
        result["overall_score"] = 101
        groq_client.return_value.chat.completions.create.return_value = (
            completion_with(json.dumps(result))
        )

        with patch.dict(os.environ, {"GROQ_API_KEY": "unit-test-key"}):
            with self.assertRaises(AnalyzerResponseError):
                analyze_resume("Resume content")

    @patch("analyzer.services.Groq")
    def test_missing_api_key_is_a_configuration_error(self, groq_client):
        with patch.dict(os.environ, {"GROQ_API_KEY": ""}):
            with self.assertRaises(AnalyzerConfigurationError):
                analyze_resume("Resume content")

        groq_client.assert_not_called()

    @patch("analyzer.services.Groq")
    def test_provider_timeout_is_reported_without_provider_details(self, groq_client):
        request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        groq_client.return_value.chat.completions.create.side_effect = (
            APITimeoutError(request=request)
        )

        with patch.dict(os.environ, {"GROQ_API_KEY": "unit-test-key"}):
            with self.assertRaises(AnalyzerProviderError):
                analyze_resume("Private resume text")

    @patch("analyzer.services.Groq")
    def test_provider_rate_limit_uses_dedicated_error(self, groq_client):
        request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        response = httpx.Response(429, request=request, json={"error": {"message": "busy"}})
        groq_client.return_value.chat.completions.create.side_effect = RateLimitError(
            "rate limited",
            response=response,
            body={"error": {"message": "busy"}},
        )

        with patch.dict(os.environ, {"GROQ_API_KEY": "unit-test-key"}):
            with self.assertRaises(AnalyzerRateLimitError):
                analyze_resume("Resume content")

    @patch("analyzer.services.Groq")
    def test_redacts_contact_details_without_removing_year_ranges(self, groq_client):
        groq_client.return_value.chat.completions.create.return_value = (
            completion_with(json.dumps(valid_analysis()))
        )

        with patch.dict(os.environ, {"GROQ_API_KEY": "unit-test-key"}):
            analyze_resume(
                "jane@example.com\n(555) 123-4567\n2019-2024",
                "Contact recruiter@example.com at 212-555-0199",
            )

        prompt = json.loads(
            groq_client.return_value.chat.completions.create.call_args.kwargs[
                "messages"
            ][1]["content"]
        )
        self.assertNotIn("jane@example.com", prompt["resume_text"])
        self.assertNotIn("555", prompt["resume_text"])
        self.assertIn("2019-2024", prompt["resume_text"])
        self.assertNotIn("recruiter@example.com", prompt["job_description"])
        self.assertNotIn("212-555-0199", prompt["job_description"])

    @patch("analyzer.services.Groq")
    def test_unexpected_provider_error_is_sanitized(self, groq_client):
        groq_client.return_value.chat.completions.create.side_effect = RuntimeError(
            "provider error containing a private key"
        )

        with patch.dict(os.environ, {"GROQ_API_KEY": "unit-test-key"}):
            with self.assertRaises(AnalyzerProviderError) as error:
                analyze_resume("Resume content")

        self.assertNotIn("private key", str(error.exception))


class AnalyzerEndpointTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="analyzer-user",
            password="test-password",
        )
        self.url = reverse("analyze-resume")

    def test_requires_authentication(self):
        response = self.client.post(
            self.url,
            {"resume_text": "Example resume"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rejects_missing_resume_text(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("resume_text", response.data)

    def test_rejects_whitespace_only_resume_text(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            {"resume_text": "   \n "},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_resume_text_over_limit(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            {"resume_text": "x" * 20_001},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("analyzer.views.analyze_resume")
    def test_returns_provider_analysis(self, analyze_resume_mock):
        self.client.force_authenticate(self.user)
        expected = valid_analysis()
        analyze_resume_mock.return_value = expected
        response = self.client.post(
            self.url,
            {
                "resume_text": " Example resume ",
                "job_description": " Target job ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual({key: response.data[key] for key in expected}, expected)
        self.assertIn('id', response.data)
        analyze_resume_mock.assert_called_once_with(
            resume_text="Example resume",
            job_description="Target job",
        )

    @patch("analyzer.views.analyze_resume")
    def test_missing_provider_configuration_returns_service_unavailable(
        self,
        analyze_resume_mock,
    ):
        self.client.force_authenticate(self.user)
        analyze_resume_mock.side_effect = AnalyzerConfigurationError(
            "Resume analysis is not configured."
        )
        response = self.client.post(
            self.url,
            {"resume_text": "Example resume"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    @patch("analyzer.views.analyze_resume")
    def test_provider_failure_returns_gateway_error(self, analyze_resume_mock):
        self.client.force_authenticate(self.user)
        analyze_resume_mock.side_effect = AnalyzerProviderError(
            "The provider is unavailable."
        )
        response = self.client.post(
            self.url,
            {"resume_text": "Example resume"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)

    @patch("analyzer.views.analyze_resume")
    def test_provider_rate_limit_returns_too_many_requests(self, analyze_resume_mock):
        self.client.force_authenticate(self.user)
        analyze_resume_mock.side_effect = AnalyzerRateLimitError(
            "Resume analysis is temporarily busy. Please try again shortly."
        )
        response = self.client.post(
            self.url,
            {"resume_text": "Example resume"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @patch("analyzer.views.analyze_resume")
    def test_rejects_malformed_analysis_result(self, analyze_resume_mock):
        self.client.force_authenticate(self.user)
        analyze_resume_mock.return_value = {"overall_score": 72}
        response = self.client.post(
            self.url,
            {"resume_text": "Example resume"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(
            response.data["detail"],
            "The analysis provider returned an invalid result.",
        )



class ResumeDocumentExtractionTests(APITestCase):
    def make_docx(self):
        buffer = BytesIO()
        document = Document()
        document.add_heading("Candidate Resume", level=1)
        document.add_paragraph("Python developer with Django experience.")
        table = document.add_table(rows=1, cols=2)
        table.rows[0].cells[0].text = "Education"
        table.rows[0].cells[1].text = "Computer Science"
        document.save(buffer)
        return buffer.getvalue()

    def test_extracts_text_from_docx_paragraphs_and_tables(self):
        uploaded = SimpleUploadedFile(
            "candidate.docx",
            self.make_docx(),
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        extracted = extract_resume_text(uploaded)

        self.assertIn("Python developer with Django experience.", extracted)
        self.assertIn("Education | Computer Science", extracted)

    def test_rejects_invalid_pdf_signature(self):
        uploaded = SimpleUploadedFile(
            "candidate.pdf",
            b"not a PDF document",
            content_type="application/pdf",
        )

        with self.assertRaises(ResumeExtractionError):
            extract_resume_text(uploaded)

    def test_rejects_empty_or_image_only_docx(self):
        buffer = BytesIO()
        Document().save(buffer)
        uploaded = SimpleUploadedFile("empty.docx", buffer.getvalue())

        with self.assertRaises(ResumeExtractionError):
            extract_resume_text(uploaded)

    @patch("analyzer.views.analyze_resume")
    def test_analyzer_accepts_docx_upload(self, analyze_resume_mock):
        user = get_user_model().objects.create_user(
            username="docx-user",
            password="test-password",
        )
        self.client.force_authenticate(user)
        expected = valid_analysis()
        analyze_resume_mock.return_value = expected
        uploaded = SimpleUploadedFile(
            "candidate.docx",
            self.make_docx(),
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        response = self.client.post(
            reverse("analyze-resume"),
            {"resume_file": uploaded, "job_description": "Python developer"},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual({key: response.data[key] for key in expected}, expected)
        self.assertIn('id', response.data)
        self.assertIn(
            "Python developer with Django experience.",
            analyze_resume_mock.call_args.kwargs["resume_text"],
        )
        self.assertEqual(
            analyze_resume_mock.call_args.kwargs["job_description"],
            "Python developer",
        )

    def test_analyzer_rejects_unsupported_file_type(self):
        user = get_user_model().objects.create_user(
            username="unsupported-file-user",
            password="test-password",
        )
        self.client.force_authenticate(user)
        uploaded = SimpleUploadedFile(
            "resume.txt",
            b"Plain text file",
            content_type="text/plain",
        )

        response = self.client.post(
            reverse("analyze-resume"),
            {"resume_file": uploaded},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("resume_file", response.data)


class ResumeAnalysisHistoryTests(APITestCase):
    def setUp(self):
        from analyzer.models import ResumeAnalysis

        self.user = get_user_model().objects.create_user(
            username="history-owner",
            password="test-password",
        )
        self.other_user = get_user_model().objects.create_user(
            username="history-other",
            password="test-password",
        )
        self.analysis = ResumeAnalysis.objects.create(
            user=self.user,
            overall_score=78,
            summary="Good evidence of relevant experience.",
            result=valid_analysis(),
        )

    def test_history_lists_only_the_authenticated_users_records(self):
        from analyzer.models import ResumeAnalysis

        ResumeAnalysis.objects.create(
            user=self.other_user,
            overall_score=40,
            summary="Private result belonging to another user.",
            result=valid_analysis(),
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("analysis-history"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.analysis.pk)

    def test_history_requires_authentication(self):
        response = self.client.get(reverse("analysis-history"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_can_delete_saved_analysis(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(
            reverse("analysis-history-detail", args=[self.analysis.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(self.analysis.__class__.objects.filter(pk=self.analysis.pk).exists())

    def test_user_cannot_read_or_delete_another_users_analysis(self):
        self.client.force_authenticate(self.other_user)
        response = self.client.get(
            reverse("analysis-history-detail", args=[self.analysis.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CoverLetterEndpointTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="cover-letter-owner",
            password="test-password",
        )
        self.other_user = get_user_model().objects.create_user(
            username="cover-letter-other",
            password="test-password",
        )
        self.client.force_authenticate(self.user)

    @patch("analyzer.views.generate_cover_letter")
    def test_generates_and_saves_letter_without_saving_source_inputs(self, generate_mock):
        from analyzer.models import CoverLetter

        generate_mock.return_value = "Dear Hiring Manager,\n\n" + ("Relevant experience. " * 12) + "\nSincerely,\nMebrie Awoke"
        response = self.client.post(
            reverse("cover-letter-generate"),
            {
                "resume_text": "Mebrie Awoke\nPython developer",
                "job_description": "Seeking a Python developer",
                "tone": "professional",
                "title": "Mebrie Awoke — Python Developer",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Mebrie Awoke — Python Developer")
        saved = CoverLetter.objects.get(pk=response.data["id"])
        self.assertEqual(saved.user, self.user)
        self.assertEqual(saved.content, generate_mock.return_value)
        generate_mock.assert_called_once()

    def test_cover_letter_library_is_private_and_owner_can_delete(self):
        from analyzer.models import CoverLetter

        letter = CoverLetter.objects.create(
            user=self.user,
            title="My application",
            content="A complete cover letter body.",
        )
        CoverLetter.objects.create(
            user=self.other_user,
            title="Private letter",
            content="Another user's private draft.",
        )
        listing = self.client.get(reverse("cover-letter-list"))
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listing.data), 1)

        deleted = self.client.delete(
            reverse("cover-letter-detail", args=[letter.pk])
        )
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)

    def test_cannot_access_another_users_cover_letter(self):
        from analyzer.models import CoverLetter

        letter = CoverLetter.objects.create(
            user=self.other_user,
            title="Private letter",
            content="Private content.",
        )
        response = self.client.get(
            reverse("cover-letter-detail", args=[letter.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
