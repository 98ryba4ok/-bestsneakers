from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User


class CustomUserCreationForm(UserCreationForm):
    """
    Форма создания нового пользователя с добавленными полями.

    Наследуется от стандартной UserCreationForm и расширяет список полей.

    Атрибуты:
        model (User): Модель пользователя.
        fields (tuple): Список отображаемых полей формы.
    """

    class Meta:
        model = User
        fields: tuple[str, ...] = (
            'username', 'phone', 'address',
            'first_name', 'last_name', 'email'
        )


class CustomUserChangeForm(UserChangeForm):
    """
    Форма редактирования данных пользователя.

    Наследуется от стандартной UserChangeForm и расширяет список полей.

    Атрибуты:
        model (User): Модель пользователя.
        fields (tuple): Список отображаемых полей формы.
    """

    class Meta:
        model = User
        fields: tuple[str, ...] = (
            'username', 'phone', 'address',
            'first_name', 'last_name', 'email'
        )
