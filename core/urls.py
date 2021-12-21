from django.urls import path
from . import views

urlpatterns = [
    # path('', views.home, name='home'),
    path('', views.index, name='index'),
    path('peer', views.peer, name='peer'),
    # path('chat/<str:room_name>/', views.peer, name='room'),
    path('register/', views.register, name='register'),
    path('register-otp/', views.register_verification, name='register_verification'),
    path('login/', views.login, name='register'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('logout/',views.logout,name="logout"),
    path('dashboard/',views.dashboard,name="dashboard"),
    path('list/',views.meeting_list,name="meeting_list"),
    path('meeting/<str:room_name>/',views.meeting,name="meeting"),
]
