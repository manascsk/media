# Generated by Django 3.2.5 on 2021-11-30 03:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_meeting_meeting_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='password',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
