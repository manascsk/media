# Generated by Django 3.2.5 on 2021-11-29 15:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Email_Otp',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.CharField(max_length=200)),
                ('otp', models.CharField(max_length=6)),
                ('valid_till', models.DateTimeField(null=True)),
            ],
            options={
                'verbose_name': 'Email_Otp',
                'verbose_name_plural': 'Email_Otps',
            },
        ),
    ]
