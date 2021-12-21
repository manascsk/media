from django.shortcuts import render,redirect,HttpResponse
from .utils import get_turn_info
from. models import *
from django.core.mail import send_mail
import random
from datetime import datetime, timedelta
from django.contrib.auth.models import User,auth
import datetime
import string
import random
# Create your views here.

def index(request):
    if request.user.is_authenticated:
        return redirect('/dashboard')
    else:
        return redirect('/login')
# Create your views here.
def room(request, room_name):
    return render(request, 'chat/room.html', {
        'room_name': room_name
    })

def peer(request, room_name):
    # get numb turn info
    context = get_turn_info()
    print('context: ', context)
    context.update({'room_name':room_name})
    return render(request, 'chat/peer.html', {
        'room_name': room_name
    })
    
    
def home(request):
    return render(request,"home.html")


# My Code


def register(request):
    if request.user.is_authenticated:
        return redirect('/')
    if request.method == 'POST':
        phone = request.POST['phone']
        email = request.POST['email']
        first_name = request.POST['fname']
        last_name = request.POST['lname']
        password = request.POST['password']
        conpassword = request.POST['confirm_password']
        if password == conpassword:
            if User.objects.filter(username=email).exists():
                context  = {"phone":phone,"email":email,"first_name":first_name,"last_name":last_name,"password":password,"conpassword":conpassword,'register_error': "Email Already Exist"}
                return render(request, 'register.html', context)
            if Profile.objects.filter(phone=phone).exists():
                context  = {"phone":phone,"email":email,"first_name":first_name,"last_name":last_name,"password":password,"conpassword":conpassword,'register_error': "Phone Number Already Exist"}
                return render(request, 'register.html', context)
            else:
                context  = {"phone":phone,"email":email,"first_name":first_name,"last_name":last_name,"password":password,"conpassword":conpassword,'register_error': "Email Already Exist"}
                request.session['phone'] = phone 
                request.session['email'] = email  
                request.session['first_name'] = first_name  
                request.session['last_name'] = last_name  
                request.session['password'] = password  
                request.session['conpassword'] = conpassword  
                otp = random.randint(100000, 999999)
                Email_Otp.objects.filter(email=email).delete()
                Email_Otp.objects.create(
                    otp=otp, email=email, valid_till=datetime.datetime.now() + timedelta(minutes=15))
                email_message = "Your OTP for Addzet Media register is {}. OTP is valid for 15 minutes only.".format(
                    otp)
                send_mail(
                    'Addzet Media Verification',
                    email_message,
                    'thedeadmancoc@gmail.com',
                    [email],
                    fail_silently=False,
                )
                return redirect('/register-otp')
        else:
            print("Password Didn't Match")
            context  = {"phone":phone,"email":email,"first_name":first_name,"last_name":last_name,"password":password,"conpassword":conpassword,'register_error': "Password Didn't Match"}
            return render(request, 'register.html',context)
    return render(request, 'register.html')
    
def register_verification(request):
    if request.user.is_authenticated:
        return redirect('/')
    phone  = request.session['phone']
    email  = request.session['email']
    first_name  = request.session['first_name']
    last_name  = request.session['last_name']
    password  = request.session['password']
    if phone == "" or email == "" or first_name == "" or last_name == "" or password == "":
        print("some cookies missing")
        return redirect('/register')
    if request.method == 'POST':
        otp = request.POST['otp']
        if Email_Otp.objects.filter(email=email).exists():
            email_otp = Email_Otp.objects.get(email=email)
            if email_otp.otp == otp:
                user = User.objects.create(first_name=first_name, last_name=last_name, email=email, username=email)
                print("User created")
                user.set_password(password)
                user.save()
                Profile.objects.create(user=user,phone=phone)
                # Session is modified. 
                del request.session['phone']
                del request.session['email']
                del request.session['first_name']
                del request.session['last_name']  
                del request.session['password']
                del request.session['conpassword']
                return redirect('/login')
            return render(request,"otp.html",{"otp":otp,"email":email,"otp_error":"Incorrect OTP"})
        return redirect('/login')
    return render(request,"otp.html",{"email":email})

def login(request):
    if request.user.is_authenticated:
        return redirect('/')
    if request.method == 'POST':
        email = request.POST["email"]
        password = request.POST["password"]
        loguser = auth.authenticate(username=email, password=password) 
        if loguser is not None:
                auth.login(request, loguser)
                current_user = request.user
                print(current_user.id)
                print("Login success")
                if request.session.get('room_name', False):
                    url = 'https://'+request.META['HTTP_HOST']+'/meeting/'+request.session['room_name']
                    print(url)
                    del request.session['room_name']
                    return redirect(url)
                return redirect('/')     
        context = {"email":email,"password":password,"login_error":"Email or Password Incorrect"}
        return render(request,"login.html",context)
    return render(request,"login.html")

def logout(request):
    auth.logout(request)
    ("logout success")
    return redirect('/login')
def forgot_password(request):
    return render(request,"forgot-password.html")

def dashboard(request):
    if not request.user.is_authenticated:
        return redirect('/login')
    today = str(datetime.date.today())
    print(today)
    if request.method == 'POST':
        name  = request.POST.get('name')
        date  = request.POST.get('date')
        time  = request.POST.get('time')
        password  = request.POST.get('password')
        host_video  = request.POST.get('host_video')
        participants_video  = request.POST.get('participants_video')
        participants_join  = request.POST.get('participants_join')
        if host_video == None:
            host_video = False
        if participants_video == None:
            participants_video = False
        if participants_join == None:
            participants_join = False
        meeting_id = ''.join(random.choices(string.ascii_uppercase +
                                    string.digits, k = 50))
        Meeting.objects.create(name=name,user=request.user,date=date,time=time,host_video=host_video,participants_video=participants_video,
                               participants_join=participants_join,password=password,meeting_id=meeting_id)
        return redirect('/dashboard')
    return render(request,"dashboard.html",{"today":today})

def meeting_list(request):
    if not request.user.is_authenticated:
        return redirect('/login')
    meeting = Meeting.objects.filter(user=request.user)
    return render(request,"meeting_list.html",{"meeting":meeting})

# def meeting(request,room_name):
#     if not request.user.is_authenticated:
#         request.session['room_name'] = room_name
#         return redirect('/login')
#     if Meeting.objects.filter(meeting_id=room_name).exists():
#         # get numb turn info
#         user = User.objects.get(username=request.user)
#         username = request.user
#         full_name = user.first_name + " " +user.last_name
#         context = get_turn_info()
#         context.update({'room_name': room_name,"username":username,"full_name":full_name,
#                         "user_video":user_video})
#         return render(request, 'meeting.html', context=context)
#     return render(request, 'meeting.html')


# def meeting(request,room_name):
#     if not request.user.is_authenticated:
#         request.session['room_name'] = room_name
#         return redirect('/login')
#     if Meeting.objects.filter(meeting_id=room_name).exists():
#         # get numb turn info
#         user = User.objects.get(username=request.user)
#         username = request.user
#         full_name = user.first_name + " " +user.last_name
#         context = get_turn_info()
#         print(context)
#         context.update({'room_name': room_name,"username":username,"full_name":full_name})
#         return render(request, 'meeting2.html', context=context)
#     return render(request, 'meeting2.html')


def meeting(request,room_name):
    if not request.user.is_authenticated:
        request.session['room_name'] = room_name
        return redirect('/login')
    if Meeting.objects.filter(meeting_id=room_name).exists():
        # get numb turn info
        user = User.objects.get(username=request.user)
        username = request.user
        full_name = user.first_name + " " +user.last_name
        context = get_turn_info()
        print(context)
        host = False
        host_username = Meeting.objects.get(meeting_id=room_name)
        host_name = host_username.user.username
        if Meeting.objects.filter(user=request.user,meeting_id=room_name).exists():
            host = True
        print(username)
        context.update({'room_name': room_name,"username":username,"full_name":full_name,"host":host,"host_name":host_name})
        return render(request, 'chat.html', context=context)
    return render(request, 'chat.html')
