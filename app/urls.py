from django.urls import path

from . import views

urlpatterns = [
	path('', views.home_view, name='home'),
	path('auth/', views.auth_view, name='auth'),
	path('quiz/', views.quiz_view, name='quiz'),
	path('dashboard/', views.dashboard_view, name='dashboard'),
	path('result/', views.result_view, name='result'),
	path('api/quiz/<slug:slug>/questions/', views.quiz_questions_api, name='quiz_questions_api'),
]
