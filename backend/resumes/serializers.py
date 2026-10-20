
from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import Resume


User = get_user_model()


class ResumeSerializer(serializers.ModelSerializer):
    resume_title = serializers.CharField(required=False, allow_blank=True, max_length=180)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = (
            "id",
            "resume_title",
            "template_identifier",
            "full_name",
            "email",
            "phone",
            "location",
            "professional_title",
            "links",
            "professional_summary",
            "education",
            "experience",
            "skills",
            "education_entries",
            "experience_entries",
            "skills_list",
            "projects",
            "certifications",
            "languages",
            "profile_photo_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_profile_photo_url(self, obj):
        if not obj.profile_photo:
            return ""
        request = self.context.get("request")
        photo_url = obj.profile_photo.url
        return request.build_absolute_uri(photo_url) if request else photo_url

    def create(self, validated_data):
        if not validated_data.get("resume_title"):
            validated_data["resume_title"] = f'{validated_data["full_name"]} Resume'
        return super().create(validated_data)

    def validate_links(self, value):
        if not isinstance(value, list) or any(not isinstance(link, dict) for link in value):
            raise serializers.ValidationError("Links must be a list of label and URL objects.")
        if any(
            not isinstance(link.get(field, ""), str)
            for link in value
            for field in ("label", "url")
        ):
            raise serializers.ValidationError("Link labels and URLs must be text values.")
        return value

    def validate_experience_entries(self, value):
        return self.validate_entries(value, ("employer", "role", "start_date", "end_date", "description"))

    def validate_education_entries(self, value):
        return self.validate_entries(value, ("institution", "degree", "start_date", "end_date", "description"))

    def validate_projects(self, value):
        return self.validate_entries(value, ("name", "url", "description"))

    @staticmethod
    def validate_entries(value, allowed_fields):
        if not isinstance(value, list):
            raise serializers.ValidationError("Expected a list of entries.")
        if any(not isinstance(entry, dict) for entry in value):
            raise serializers.ValidationError("Each entry must be an object.")
        if any(
            not isinstance(item, str)
            for entry in value
            for key, item in entry.items()
            if key in allowed_fields
        ):
            raise serializers.ValidationError("Entry fields must be text values.")
        return [
            {key: item for key, item in entry.items() if key in allowed_fields}
            for entry in value
        ]

    def validate_skills_list(self, value):
        if not isinstance(value, list) or any(not isinstance(skill, str) for skill in value):
            raise serializers.ValidationError("Skills must be a list of text values.")
        return value

    def validate_certifications(self, value):
        return self.validate_string_entries(value)

    def validate_languages(self, value):
        return self.validate_string_entries(value)

    @staticmethod
    def validate_string_entries(value):
        if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
            raise serializers.ValidationError("Expected a list of text values.")
        return value


class RegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")
        read_only_fields = ("id",)

    def validate_password(self, value):
        try:
            password_validation.validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
