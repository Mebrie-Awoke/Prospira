from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthenticationAndResumeAPITests(APITestCase):
	def setUp(self):
		self.register_url = reverse("register")
		self.token_url = reverse("token_obtain_pair")
		self.refresh_url = reverse("token_refresh")
		self.resume_list_url = reverse("resume-list-create")

	def test_registers_user_without_returning_password(self):
		response = self.client.post(
			self.register_url,
			{
				"username": "testuser",
				"email": "test@example.com",
				"password": "SecureTest123!",
				"is_staff": True,
				"is_superuser": True,
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertNotIn("password", response.data)
		user = User.objects.get(username="testuser")
		self.assertNotEqual(user.password, "SecureTest123!")
		self.assertTrue(user.check_password("SecureTest123!"))
		self.assertFalse(user.is_staff)
		self.assertFalse(user.is_superuser)

	def test_registration_rejects_short_password(self):
		response = self.client.post(
			self.register_url,
			{"username": "shortpass", "email": "short@example.com", "password": "short"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn("password", response.data)

	def test_registration_rejects_duplicate_username(self):
		User.objects.create_user(
			username="existing", email="existing@example.com", password="SecureTest123!"
		)
		response = self.client.post(
			self.register_url,
			{
				"username": "existing",
				"email": "another@example.com",
				"password": "SecureTest123!",
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn("username", response.data)

	def test_valid_credentials_return_jwt_tokens(self):
		User.objects.create_user(username="loginuser", password="SecureTest123!")
		response = self.client.post(
			self.token_url,
			{"username": "loginuser", "password": "SecureTest123!"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("access", response.data)
		self.assertIn("refresh", response.data)

	def test_invalid_credentials_do_not_return_jwt_tokens(self):
		User.objects.create_user(username="loginuser", password="SecureTest123!")
		response = self.client.post(
			self.token_url,
			{"username": "loginuser", "password": "wrong-password"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
		self.assertNotIn("access", response.data)
		self.assertNotIn("refresh", response.data)

	def test_valid_refresh_token_returns_new_access_token(self):
		User.objects.create_user(username="refreshuser", password="SecureTest123!")
		token_response = self.client.post(
			self.token_url,
			{"username": "refreshuser", "password": "SecureTest123!"},
			format="json",
		)
		response = self.client.post(
			self.refresh_url,
			{"refresh": token_response.data["refresh"]},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("access", response.data)

	def test_resume_list_requires_authentication(self):
		response = self.client.get(self.resume_list_url)

		self.assertIn(
			response.status_code,
			(status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
		)

	def test_authenticated_user_can_access_resume_api(self):
		user = User.objects.create_user(username="resumeuser", password="SecureTest123!")
		self.client.force_authenticate(user=user)

		response = self.client.get(self.resume_list_url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_jwt_access_token_authorizes_resume_api(self):
		User.objects.create_user(username="jwtuser", password="SecureTest123!")
		token_response = self.client.post(
			self.token_url,
			{"username": "jwtuser", "password": "SecureTest123!"},
			format="json",
		)
		self.client.credentials(
			HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}"
		)

		response = self.client.get(self.resume_list_url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_resume_crud_operations_remain_available(self):
		user = User.objects.create_user(username="cruduser", password="SecureTest123!")
		self.client.force_authenticate(user=user)
		resume_data = {
			"full_name": "Taylor Example",
			"email": "taylor@example.com",
			"phone": "555-0100",
			"professional_summary": "Experienced engineer",
			"education": "Computer Science",
			"experience": "Five years",
			"skills": "Python, Django",
		}

		create_response = self.client.post(self.resume_list_url, resume_data, format="json")
		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		detail_url = reverse("resume-detail", args=[create_response.data["id"]])

		list_response = self.client.get(self.resume_list_url)
		self.assertEqual(list_response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(list_response.data), 1)

		retrieve_response = self.client.get(detail_url)
		self.assertEqual(retrieve_response.status_code, status.HTTP_200_OK)

		update_response = self.client.patch(
			detail_url, {"full_name": "Taylor Updated"}, format="json"
		)
		self.assertEqual(update_response.status_code, status.HTTP_200_OK)
		self.assertEqual(update_response.data["full_name"], "Taylor Updated")

		delete_response = self.client.delete(detail_url)
		self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
