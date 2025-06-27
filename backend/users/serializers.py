from __future__ import annotations
from typing import Dict, Any
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для отображения основных данных пользователя."""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_superuser', 'is_active']

class UserUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления прав и статуса пользователя."""

    class Meta:
        model = User
        fields = ['is_superuser', 'is_active']

class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор регистрации нового пользователя."""

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'phone', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data: Dict[str, Any]) :
        """
        Создает нового пользователя с заданными данными.

        Args:
            validated_data (Dict[str, Any]): Проверенные данные для создания пользователя.

        Returns:
            User: Созданный пользователь.
        """
        return User.objects.create_user(**validated_data)
