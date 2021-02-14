from django.urls import path

from . import views

app_name = 'editor'
urlpatterns = [
    path('', views.index, name='index'),
    path('ffmpeg_render/<slug:content>/', views.ffmpeg_render, name='ffmpeg_render'),
]
