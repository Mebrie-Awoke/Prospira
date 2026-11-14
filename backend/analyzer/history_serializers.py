from rest_framework import serializers

from analyzer.models import ResumeAnalysis


class ResumeAnalysisHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeAnalysis
        fields = ("id", "overall_score", "summary", "result", "created_at")
        read_only_fields = fields


class CoverLetterRequestSerializer(serializers.Serializer):
    resume_text = serializers.CharField(max_length=20_000, trim_whitespace=True)
    job_description = serializers.CharField(max_length=12_000, trim_whitespace=True)
    tone = serializers.ChoiceField(
        choices=("professional", "confident", "warm"),
        default="professional",
    )
    title = serializers.CharField(max_length=160, required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs["resume_text"].strip():
            raise serializers.ValidationError({"resume_text": "Add your resume details."})
        if not attrs["job_description"].strip():
            raise serializers.ValidationError({"job_description": "Add the target job description."})
        return attrs


class CoverLetterSerializer(serializers.ModelSerializer):
    class Meta:
        from analyzer.models import CoverLetter

        model = CoverLetter
        fields = ("id", "title", "content", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
