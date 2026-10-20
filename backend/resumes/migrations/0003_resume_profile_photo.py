from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("resumes", "0002_resume_builder_data"),
    ]

    operations = [
        migrations.AddField(
            model_name="resume",
            name="profile_photo",
            field=models.ImageField(blank=True, upload_to="resume_photos/"),
        ),
    ]
