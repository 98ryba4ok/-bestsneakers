from typing import Optional, Type, Union
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import AbstractBaseUser
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status, generics, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token

from .serializers import RegisterSerializer, UserSerializer, UserUpdateSerializer

User: Type[AbstractBaseUser] = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления пользователями.
    Доступ только администраторам.
    """
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]
    """
        Возвращает класс сериализатора в зависимости от действия.
        Для обновления используется UserUpdateSerializer,
        для остальных действий — UserSerializer.
    """
    def get_serializer_class(self) -> Type[Union[RegisterSerializer, UserSerializer, UserUpdateSerializer]]:
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

class LoginView(APIView):
    """
    Представление для аутентификации пользователя и выдачи токена.
    Доступно всем (AllowAny).
    """
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """
        Аутентификация пользователя по username и password.

        Args:
            request (Request): HTTP-запрос с полями username и password.

        Returns:
            Response: JSON с токеном при успешной аутентификации
                      или ошибкой 400 при неверных данных.
        """
        username: Optional[str] = request.data.get('username')
        password: Optional[str] = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key})
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    """
    Представление для регистрации нового пользователя.
    Доступно всем (AllowAny).
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class ProfileView(APIView):
    """
    Представление для работы с профилем текущего пользователя.
    Доступно только авторизованным пользователям.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """
        Получение информации о текущем пользователе.

        Args:
            request (Request): HTTP-запрос с авторизацией.

        Returns:
            Response: JSON с информацией пользователя.
        """
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': getattr(user, 'phone', None),
            'address': getattr(user, 'address', None),
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_superuser': user.is_superuser,
        })

    def put(self, request: Request) -> Response:
        """
        Обновление данных профиля текущего пользователя.

        Args:
            request (Request): HTTP-запрос с новыми данными пользователя.

        Returns:
            Response: JSON с обновленными данными пользователя.
        """
        user = request.user
        for field in ['username', 'email', 'phone', 'address', 'first_name', 'last_name']:
            value = request.data.get(field)
            if value is not None:
                setattr(user, field, value)

        user.save()

        return Response({
            'username': user.username,
            'email': user.email,
            'phone': getattr(user, 'phone', None),
            'address': getattr(user, 'address', None),
            'first_name': user.first_name,
            'last_name': user.last_name,
        })

    def delete(self, request: Request) -> Response:
        """
        Удаление аккаунта текущего пользователя.

        Args:
            request (Request): HTTP-запрос с авторизацией.

        Returns:
            Response: Подтверждение удаления аккаунта.
        """
        request.user.delete()
        return Response({'detail': 'Аккаунт удалён.'}, status=status.HTTP_204_NO_CONTENT)
