from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from PIL import Image

from .models import Resume


class ResumeOwnershipTests(APITestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(username="owner", password="TestPass123!")
        self.other_user = get_user_model().objects.create_user(username="other", password="TestPass123!")
        self.resume = Resume.objects.create(
            user=self.owner,
            resume_title="Private resume",
            full_name="Avery Example",
            email="avery@example.com",
        )
        self.detail_url = reverse("resume-detail", args=[self.resume.pk])
        self.list_url = reverse("resume-list-create")

    def test_users_only_list_their_own_resumes(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_users_cannot_retrieve_update_or_delete_another_users_resume(self):
        self.client.force_authenticate(user=self.other_user)

        self.assertEqual(self.client.get(self.detail_url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.patch(self.detail_url, {"resume_title": "Stolen"}).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.delete(self.detail_url).status_code, status.HTTP_404_NOT_FOUND)
        self.resume.refresh_from_db()
        self.assertEqual(self.resume.resume_title, "Private resume")

    def test_create_assigns_authenticated_user_and_structured_content(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            self.list_url,
            {
                "full_name": "Avery Example",
                "email": "avery@example.com",
                "resume_title": "Product Designer",
                "template_identifier": "modern-blue",
                "experience_entries": [
                    {"employer": "Studio", "role": "Designer", "description": "Led redesign"}
                ],
                "skills_list": ["Research", "Prototyping"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = Resume.objects.get(pk=response.data["id"])
        self.assertEqual(created.user, self.owner)
        self.assertEqual(created.experience_entries[0]["role"], "Designer")
        self.assertEqual(created.skills_list, ["Research", "Prototyping"])


class ResumePhotoAPITests(APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.media_dir = TemporaryDirectory()
        cls.media_settings = override_settings(MEDIA_ROOT=cls.media_dir.name)
        cls.media_settings.enable()

    @classmethod
    def tearDownClass(cls):
        cls.media_settings.disable()
        cls.media_dir.cleanup()
        super().tearDownClass()

    def setUp(self):
        self.owner = get_user_model().objects.create_user(username="photo-owner", password="TestPass123!")
        self.other_user = get_user_model().objects.create_user(username="photo-other", password="TestPass123!")
        self.resume = Resume.objects.create(
            user=self.owner,
            full_name="Photo Example",
            email="photo@example.com",
        )
        self.photo_url = reverse("resume-photo", args=[self.resume.pk])

    @staticmethod
    def image_upload(name="profile.png"):
        image_file = BytesIO()
        Image.new("RGB", (32, 32), color="blue").save(image_file, format="PNG")
        return SimpleUploadedFile(name, image_file.getvalue(), content_type="image/png")

    def test_owner_can_upload_and_remove_photo(self):
        self.client.force_authenticate(user=self.owner)
        upload = self.client.post(
            self.photo_url,
            {"photo": self.image_upload()},
            format="multipart",
        )
        self.assertEqual(upload.status_code, status.HTTP_200_OK)
        self.assertTrue(upload.data["profile_photo_url"].endswith(".png"))
        self.resume.refresh_from_db()
        self.assertTrue(self.resume.profile_photo.storage.exists(self.resume.profile_photo.name))

        delete = self.client.delete(self.photo_url)
        self.assertEqual(delete.status_code, status.HTTP_200_OK)
        self.assertEqual(delete.data["profile_photo_url"], "")
        self.resume.refresh_from_db()
        self.assertFalse(self.resume.profile_photo)

    def test_other_users_cannot_upload_or_remove_photo(self):
        self.client.force_authenticate(user=self.other_user)
        upload = self.client.post(
            self.photo_url,
            {"photo": self.image_upload()},
            format="multipart",
        )
        self.assertEqual(upload.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(self.photo_url).status_code, status.HTTP_404_NOT_FOUND)

    def test_rejects_non_image_upload(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            self.photo_url,
            {"photo": SimpleUploadedFile("not-image.png", b"not an image", content_type="image/png")},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("photo", response.data)

    def test_rejects_photo_larger_than_five_megabytes(self):
        self.client.force_authenticate(user=self.owner)
        valid_image = self.image_upload().read()
        oversized_image = SimpleUploadedFile(
            "oversized.png",
            valid_image + b"x" * (5 * 1024 * 1024),
            content_type="image/png",
        )
        response = self.client.post(
            self.photo_url,
            {"photo": oversized_image},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("photo", response.data)
