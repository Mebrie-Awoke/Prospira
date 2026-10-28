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


class ResumeAnalysisResponseSerializer(serializers.Serializer):
    overall_score = serializers.IntegerField(min_value=0, max_value=100)
    summary = serializers.CharField(max_length=2_000)
    strengths = serializers.ListField(
        child=serializers.CharField(max_length=500), max_length=20
    )
    improvements = serializers.ListField(
        child=serializers.CharField(max_length=500), max_length=20
    )
    skills_found = serializers.ListField(
        child=serializers.CharField(max_length=200), max_length=50
    )
    missing_job_skills = serializers.ListField(
        child=serializers.CharField(max_length=200), max_length=50
    )
    experience_feedback = serializers.CharField(max_length=2_000)
    formatting_feedback = serializers.CharField(max_length=2_000)
    recommendations = serializers.ListField(
        child=serializers.CharField(max_length=500), max_length=20
    )
