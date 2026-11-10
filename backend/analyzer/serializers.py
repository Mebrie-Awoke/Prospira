from rest_framework import serializers


MAX_RESUME_LENGTH = 20_000
MAX_JOB_LENGTH = 12_000
MAX_FILE_SIZE = 5 * 1024 * 1024


class ResumeAnalysisRequestSerializer(serializers.Serializer):
    resume_text = serializers.CharField(
        max_length=MAX_RESUME_LENGTH,
        required=False,
        allow_blank=True,
        trim_whitespace=False,
    )
    resume_file = serializers.FileField(required=False, write_only=True)
    job_description = serializers.CharField(
        max_length=MAX_JOB_LENGTH,
        required=False,
        allow_blank=True,
        default="",
        trim_whitespace=False,
    )

    def validate_resume_file(self, value):
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError("Resume files must be 5 MB or smaller.")
        extension = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if extension not in {"pdf", "docx"}:
            raise serializers.ValidationError("Upload a PDF or DOCX file.")
        return value

    def validate(self, attrs):
        resume_text = attrs.get("resume_text", "").strip()
        resume_file = attrs.get("resume_file")
        if not resume_text and not resume_file:
            raise serializers.ValidationError(
                {"resume_text": "Provide resume text or upload a PDF/DOCX file."}
            )
        if resume_text and resume_file:
            raise serializers.ValidationError(
                "Provide either resume text or one PDF/DOCX file, not both."
            )
        attrs["resume_text"] = resume_text
        attrs["job_description"] = attrs.get("job_description", "").strip()
        return attrs


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
