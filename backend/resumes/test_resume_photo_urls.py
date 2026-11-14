from io import BytesIO
from tempfile import TemporaryDirectory
from urllib.parse import urlparse

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIRequestFactory

from resumes.models import Resume
from resumes.serializers import ResumeSerializer


class SignedResumePhotoURLTests(TestCase):
    def setUp(self):
        self.media_dir = TemporaryDirectory()
        self.override = override_settings(MEDIA_ROOT=self.media_dir.name)
        self.override.enable()
        self.user = get_user_model().objects.create_user(
            username="photo-owner",
            password="test-password",
        )
        image = Image.new("RGB", (24, 24), color="teal")
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        self.resume = Resume.objects.create(
            user=self.user,
            full_name="Mebrie Awoke",
            email="mebrie@example.com",
            profile_photo=ContentFile(
                buffer.getvalue(),
                name="mebrie-photo.png",
            ),
        )

    def tearDown(self):
        self.resume.profile_photo.delete(save=False)
        self.override.disable()
        self.media_dir.cleanup()

    def test_photo_url_is_signed_and_can_be_loaded_without_exposing_media_path(self):
        request = APIRequestFactory().get("/")
        payload = ResumeSerializer(self.resume, context={"request": request}).data
        photo_url = payload["profile_photo_url"]

        self.assertIn("/api/resume-photo/", photo_url)
        self.assertNotIn("/media/", photo_url)
        response = self.client.get(urlparse(photo_url).path)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/png")
        self.assertIn("private", response["Cache-Control"])

    def test_invalid_photo_token_is_not_found(self):
        response = self.client.get("/api/resume-photo/not-a-valid-signature/")
        self.assertEqual(response.status_code, 404)
