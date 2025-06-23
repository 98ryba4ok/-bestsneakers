# users/views.py

from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()
# users/views.py

from rest_framework import viewsets

from rest_framework.permissions import IsAdminUser



class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key})
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class ProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'phone': request.user.phone,
            'address': request.user.address,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'is_superuser': request.user.is_superuser,
        })

    def put(self, request):
        user = request.user
        for field in ['username', 'email', 'phone', 'address', 'first_name', 'last_name']:
            value = request.data.get(field)
            if value is not None:
                setattr(user, field, value)

        user.save()

        return Response({
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'address': user.address,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })

    def delete(self, request):
        request.user.delete()
        return Response({'detail': 'Аккаунт удалён.'}, status=status.HTTP_204_NO_CONTENT)
