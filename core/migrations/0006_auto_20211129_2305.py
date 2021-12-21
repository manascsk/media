# Generated by Django 3.2.5 on 2021-11-29 17:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_meeting_user'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='meeting',
            name='datetime',
        ),
        migrations.AddField(
            model_name='meeting',
            name='date',
            field=models.DateField(null=True),
        ),
        migrations.AddField(
            model_name='meeting',
            name='time',
            field=models.TimeField(null=True),
        ),
    ]
