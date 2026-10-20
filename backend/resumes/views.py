
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Resume
from .serializers import RegistrationSerializer, ResumeSerializer


class RegistrationAPIView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]


class ResumeListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ResumeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)


class ResumePhotoSerializer(serializers.Serializer):
    photo = serializers.ImageField()

    def validate_photo(self, photo):
        if photo.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Profile photos must be 5 MB or smaller.")
        return photo


class ResumePhotoAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        resume = get_object_or_404(Resume.objects.filter(user=request.user), pk=pk)
        serializer = ResumePhotoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        previous_photo = resume.profile_photo.name
        resume.profile_photo = serializer.validated_data["photo"]
        resume.save(update_fields=("profile_photo", "updated_at"))
        if previous_photo:
            default_storage.delete(previous_photo)
        return Response(ResumeSerializer(resume, context={"request": request}).data)

    def delete(self, request, pk):
        resume = get_object_or_404(Resume.objects.filter(user=request.user), pk=pk)
        if resume.profile_photo:
            resume.profile_photo.delete(save=False)
            resume.save(update_fields=("profile_photo", "updated_at"))
        return Response(ResumeSerializer(resume, context={"request": request}).data)
