from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def populate_structured_fields(apps, schema_editor):
    Resume = apps.get_model("resumes", "Resume")
    for resume in Resume.objects.all().iterator():
        resume.resume_title = f"{resume.full_name} Resume"
        resume.experience_entries = (
            [{"employer": "", "role": "", "start_date": "", "end_date": "", "description": resume.experience}]
            if resume.experience.strip()
            else []
        )
        resume.education_entries = (
            [{"institution": "", "degree": "", "start_date": "", "end_date": "", "description": resume.education}]
            if resume.education.strip()
            else []
        )
        resume.skills_list = [
            skill.strip()
            for skill in resume.skills.replace("\n", ",").split(",")
            if skill.strip()
        ]
        resume.save(
            update_fields=(
                "resume_title",
                "experience_entries",
                "education_entries",
                "skills_list",
            )
        )


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("resumes", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="resume",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="resumes",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="resume",
            name="resume_title",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="resume",
            name="template_identifier",
            field=models.CharField(
                choices=[
                    ("classic", "Classic Professional"),
                    ("modern-blue", "Modern Blue"),
                    ("minimalist", "Minimalist"),
                    ("executive", "Executive"),
                ],
                default="classic",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="resume",
            name="location",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="resume",
            name="professional_title",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="resume",
            name="links",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="resume",
            name="education_entries",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="resume",
            name="experience_entries",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="resume",
            name="skills_list",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="resume",
            name="projects",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="resume",
            name="certifications",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="resume",
            name="languages",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.RunPython(populate_structured_fields, migrations.RunPython.noop),
    ]
