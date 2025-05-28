from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Max, Sum, F
from .models import *
from .serializers import *
from django_filters.rest_framework import DjangoFilterBackend
from .filters import SneakerFilter
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [AllowAny]

class SneakerViewSet(viewsets.ModelViewSet):
    queryset = Sneaker.objects.all()
    serializer_class = SneakerSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = SneakerFilter
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Sneaker.objects.select_related('brand')  # подгружаем бренд одним JOIN

        # Предзагрузка отзывов отдельным запросом (reviews — related_name для Review)
        qs = qs.prefetch_related('reviews')

        # Фильтры и сортировка
        qs = qs.filter(brand__name='Nike').exclude(price__lt=100).order_by('brand__name', '-price')

        # Аннотация среднего рейтинга из отзывов
        qs = qs.annotate(avg_rating=Avg('reviews__rating'))

        return qs


class SizeViewSet(viewsets.ModelViewSet):
    queryset = Size.objects.all()
    serializer_class = SizeSerializer
    permission_classes = [AllowAny]

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [AllowAny]

class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        qs = Order.objects.select_related('user')  # подгружаем пользователя одним JOIN
        qs = qs.prefetch_related('items')  # подгружаем элементы заказа отдельным запросом

        # Аннотация общего количества товаров в заказе
        qs = qs.annotate(total_items=Sum('items__quantity'))

        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        # Агрегация: сумма всех total_price всех заказов
        total_revenue = Order.objects.aggregate(total_revenue=Sum('total_price'))['total_revenue'] or 0

        # Включаем агрегированную сумму в ответ
        response.data = {
            'total_revenue': total_revenue,
            'orders': response.data,
        }
        return response

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class MainBannerViewSet(viewsets.ModelViewSet):
    queryset = MainBanner.objects.all()
    serializer_class = MainBannerSerializer

class PrivacyPolicyViewSet(viewsets.ModelViewSet):
    queryset = PrivacyPolicy.objects.all()
    serializer_class = PrivacyPolicySerializer
