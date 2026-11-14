from rest_framework import serializers

from analyzer.models import ResumeAnalysis


class ResumeAnalysisHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeAnalysis
        fields = ("id", "overall_score", "summary", "result", "created_at")
        read_only_fields = fields
