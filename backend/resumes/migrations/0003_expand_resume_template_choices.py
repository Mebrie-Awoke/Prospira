from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("resumes", "0002_resume_builder_data"),
    ]

    operations = [
        migrations.AlterField(
            model_name="resume",
            name="template_identifier",
            field=models.CharField(
                choices=[
                    ("classic", "Classic Professional"),
                    ("modern-blue", "Modern Blue"),
                    ("minimalist", "Minimalist"),
                    ("executive", "Executive"),
                    ("technical", "Technical"),
                    ("academic", "Academic"),
                    ("creative", "Creative"),
                    ("compact", "Compact"),
                ],
                default="classic",
                max_length=32,
            ),
        ),
    ]
