# users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, RegisterView, ProfileView, UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('register/', RegisterView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('', include(router.urls)),  # Добавить router сюда!
]
