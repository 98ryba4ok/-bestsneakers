from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Max, Sum, F
from .models import *
from .serializers import *
from django_filters.rest_framework import DjangoFilterBackend
from .filters import SneakerFilter
from rest_framework import filters



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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = SneakerFilter
    search_fields = ['name', 'brand__name']
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Sneaker.objects.select_related('brand')  # подгружаем бренд одним JOIN
        
        # Предзагрузка отзывов отдельным запросом (reviews — related_name для Review)
        qs = qs.prefetch_related('reviews')

        # Фильтры и сортировка
       

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
    permission_classes = [IsAuthenticated]
    queryset = Cart.objects.all()
    serializer_class = CartSerializer

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


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
    serializer_class = ReviewSerializer
    queryset = Review.objects.all()

    def perform_create(self, serializer):
        print("USER:", self.request.user)
        print("DATA:", serializer.validated_data)
        serializer.save(user=self.request.user)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class MainBannerViewSet(viewsets.ModelViewSet):
    queryset = MainBanner.objects.all()
    serializer_class = MainBannerSerializer

class PrivacyPolicyViewSet(viewsets.ModelViewSet):
    queryset = PrivacyPolicy.objects.all()
    serializer_class = PrivacyPolicySerializer


