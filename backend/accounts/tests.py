from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AccountProfileAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="prospira-test",
            email="prospira@example.com",
            password="Current-Password-2026!",
        )
        self.client.force_authenticate(self.user)

    def test_user_can_read_and_update_own_profile(self):
        response = self.client.get("/api/account/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "prospira-test")

        response = self.client.patch(
            "/api/account/profile/",
            {"first_name": "Avery", "last_name": "Morgan", "email": "avery@example.com"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Avery")
        self.assertEqual(self.user.email, "avery@example.com")

    def test_user_can_change_password_with_current_password(self):
        response = self.client.post(
            "/api/account/password/",
            {
                "current_password": "Current-Password-2026!",
                "new_password": "Another-Strong-Passphrase-2026!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Another-Strong-Passphrase-2026!"))

    def test_password_change_rejects_incorrect_current_password(self):
        response = self.client.post(
            "/api/account/password/",
            {
                "current_password": "not-the-current-password",
                "new_password": "Another-Strong-Passphrase-2026!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
