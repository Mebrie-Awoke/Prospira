from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from resumes.models import Resume


User = get_user_model()


class ResumePDFExportTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="pdf-owner",
            password="SecureTest123!",
        )
        self.resume = Resume.objects.create(
            user=self.owner,
            resume_title="Backend Engineer Resume",
            template_identifier="technical",
            full_name="Taylor Example",
            email="taylor@example.com",
            professional_title="Backend Engineer",
            professional_summary="Builds reliable APIs and services.",
            experience_entries=[{
                "role": "Backend Developer",
                "employer": "Example Studio",
                "start_date": "2024",
                "end_date": "Present",
                "description": "Designed and maintained REST APIs.",
            }],
            education_entries=[{
                "degree": "BSc Computer Science",
                "institution": "Example University",
            }],
            skills_list=["Python", "Django", "PostgreSQL"],
            projects=[{
                "name": "Portfolio API",
                "url": "https://example.com",
                "description": "A production-style portfolio service.",
            }],
            certifications=["Python Developer"],
            languages=["English"],
        )
        self.url = reverse("resume-pdf", args=[self.resume.pk])

    def test_owner_can_download_a_real_pdf(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment;", response["Content-Disposition"])
        self.assertTrue(response.content.startswith(b"%PDF-"))
        self.assertGreater(len(response.content), 1000)

    def test_pdf_download_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_user_cannot_download_another_users_resume(self):
        other_user = User.objects.create_user(
            username="pdf-other",
            password="SecureTest123!",
        )
        self.client.force_authenticate(user=other_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
