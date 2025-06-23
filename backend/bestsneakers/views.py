from rest_framework import viewsets, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Avg, Count, Max, Sum, F
from .models import *
from .serializers import *
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from .filters import SneakerFilter
from rest_framework import filters
from rest_framework.permissions import IsAdminUser
from rest_framework.permissions import BasePermission
class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.user == request.user
    
class CheckoutViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        serializer = CheckoutSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order = serializer.save()
            return Response({"message": "Заказ оформлен", "order_id": order.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        qs = super().get_queryset().select_related('brand').prefetch_related('reviews', 'images')
        qs = qs.annotate(
    avg_rating=Avg('reviews__rating'),
    sold_count=Sum('orderitem__quantity')
)

        return qs

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [AllowAny()]


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
        return Cart.objects.filter(user=self.request.user).select_related('sneaker', 'size')

    def get_serializer_context(self):
        return {'request': self.request}


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.select_related('sneaker', 'size', 'order')
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        # Показываем только заказы текущего пользователя или все — если админ
        user = self.request.user
        qs = Order.objects.select_related('user').prefetch_related('items').annotate(
            total_items=Sum('items__quantity')
        )
        if user.is_staff:
            return qs
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        # Только для админа показываем общую выручку
        total_revenue = 0
        if request.user.is_staff:
            total_revenue = Order.objects.aggregate(total_revenue=Sum('total_price'))['total_revenue'] or 0

        response.data = {
            'total_revenue': total_revenue,
            'orders': response.data,
        }
        return response

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    queryset = Review.objects.select_related('user', 'sneaker')


    def perform_create(self, serializer):
        print("USER:", self.request.user)
        print("DATA:", serializer.validated_data)
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def average_rating(self, request):
        """Вернуть средний рейтинг всех товаров или по конкретному товару."""
        sneaker_id = request.query_params.get('sneaker')

        if sneaker_id is not None:
            avg_rating = Review.objects.filter(sneaker=sneaker_id).aggregate(avg=Avg('rating'))
        else:
            avg_rating = Review.objects.aggregate(avg=Avg('rating'))

        return Response({'average_rating': round(avg_rating['avg'], 2) if avg_rating['avg'] is not None else None})

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class MainBannerViewSet(viewsets.ModelViewSet):
    queryset = MainBanner.objects.all()
    serializer_class = MainBannerSerializer

class PrivacyPolicyViewSet(viewsets.ModelViewSet):
    queryset = PrivacyPolicy.objects.all()
    serializer_class = PrivacyPolicySerializer


class FilterOptionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        brands = Brand.objects.values_list("name", flat=True)
        categories = Category.objects.values_list("name", flat=True)
        colors = Sneaker.objects.exclude(color__isnull=True).values_list("color", flat=True).distinct()
        sizes = Size.objects.values_list("size", flat=True).distinct()


        data = {
            "brands": list(brands),
            "categories": list(categories),
            "colors": list(colors),
            "genders": [
                {"value": "M", "label": "Мужской"},
                {"value": "F", "label": "Женский"},
                {"value": "U", "label": "Унисекс"},
            ],
            "sizes": list(map(str, sizes)),
        }

        serializer = FilterOptionsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ElexamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = elexam.objects.filter(is_public=True).order_by('-exam_date')
    serializer_class = ElexamSerializer