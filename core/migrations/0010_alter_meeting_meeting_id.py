# Generated by Django 3.2.5 on 2021-11-30 08:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_meeting_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='meeting',
            name='meeting_id',
            field=models.TextField(null=True),
        ),
    ]
