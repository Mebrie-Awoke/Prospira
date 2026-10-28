import json
import os
from types import SimpleNamespace
from unittest.mock import patch

import httpx
from django.contrib.auth import get_user_model
from django.urls import reverse
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
        self.assertEqual(response.data, expected)
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
