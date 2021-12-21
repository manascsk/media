from django.db import models
from django.contrib.auth.models import User
from django_base64field.fields import Base64Field

# Create your models here.
class Profile(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE,null=True)
    image = Base64Field(max_length=999999999999, blank=True, null=True)
    phone = models.CharField(max_length=10,null=True,blank=True)
    def __str__(self):
        return self.phone
    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profiles"

class Email_Otp(models.Model):
    email = models.CharField(max_length=200)
    otp = models.CharField(max_length=6)
    valid_till = models.DateTimeField(null=True)
    def __str__(self):
        return self.email
    class Meta:
        verbose_name = "Email_Otp"
        verbose_name_plural = "Email_Otps"
MEETING_STATUS = (
    ('End', 'End'),
    ('Cancelled', 'Cancelled'),
    ('Pending', 'Pending'),
    ('Continue', 'Continue'),
    ('Extend', 'Extend'),
)
class Meeting(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE,null=True)
    name = models.TextField(null=True)
    date = models.DateField(null=True)
    time = models.TimeField(null=True)
    host_video = models.BooleanField(default=False,null=True)
    participants_video = models.BooleanField(default=False,null=True)    
    participants_join = models.BooleanField(default=False,null=True)
    meeting_id = models.TextField(null=True)
    password = models.CharField(max_length=100,null=True,blank=True)
    status = models.CharField(choices=MEETING_STATUS,default="Pending",max_length=100,null=True,blank=True)
    def __str__(self):
        return self.name
    class Meta:
        verbose_name = "Meeting"
        verbose_name_plural = "Meetings"