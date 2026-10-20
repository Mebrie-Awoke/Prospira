from rest_framework import serializers


class ResumeAnalysisRequestSerializer(serializers.Serializer):
    resume_text = serializers.CharField(max_length=20_000, trim_whitespace=False)
    job_description = serializers.CharField(
        max_length=12_000,
        required=False,
        allow_blank=True,
        default="",
        trim_whitespace=False,
    )

    def validate_resume_text(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Resume text cannot be empty.")
        return value.strip()

    def validate_job_description(self, value: str) -> str:
        return value.strip()
