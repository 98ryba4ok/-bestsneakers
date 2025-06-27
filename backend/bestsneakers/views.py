from rest_framework import viewsets, generics, status, filters
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, BasePermission
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Avg, Count, Max, Sum, F, QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from .models import *
from .serializers import *
from .filters import SneakerFilter
from typing import Any



class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj) -> bool:
        """
        Проверяет, является ли пользователь владельцем объекта или администратором.

        Args:
            request: Объект запроса.
            view: Представление.
            obj: Проверяемый объект.

        Returns:
            bool: True, если пользователь — админ или владелец.
        """
        return request.user.is_staff or obj.user == request.user


class CheckoutViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request) -> Response:
        """
        Создание заказа при оформлении.

        Args:
            request: Объект запроса с данными заказа.

        Returns:
            Response: Ответ с ID заказа или ошибками валидации.
        """
        serializer = CheckoutSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order = serializer.save()
            return Response({"message": "Заказ оформлен", "order_id": order.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet для категорий товаров."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class BrandViewSet(viewsets.ModelViewSet):
    """ViewSet для брендов."""
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [AllowAny]


class SneakerViewSet(viewsets.ModelViewSet):
    """ViewSet для кроссовок с фильтрацией, поиском и аннотациями."""
    queryset = Sneaker.objects.all()
    serializer_class = SneakerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = SneakerFilter
    search_fields = ['name', 'brand__name']
    permission_classes = [AllowAny]

    def get_queryset(self) -> QuerySet:
        """
        Получить список кроссовок с предзагрузкой связанных объектов и аннотациями.

        Returns:
            QuerySet: Запрос с аннотациями и предзагрузкой.
        """
        qs = super().get_queryset().select_related('brand').prefetch_related('reviews', 'images')
        qs = qs.annotate(
            avg_rating=Avg('reviews__rating'),
            sold_count=Sum('orderitem__quantity')
        )
        return qs

    def get_permissions(self) -> list:
        """
        Определение прав доступа на основе действия.

        Returns:
            list: Список разрешений.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [AllowAny()]


class SizeViewSet(viewsets.ModelViewSet):
    """ViewSet для размеров кроссовок."""
    queryset = Size.objects.all()
    serializer_class = SizeSerializer
    permission_classes = [AllowAny]


class StockViewSet(viewsets.ModelViewSet):
    """ViewSet для остатков на складе."""
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [AllowAny]


class CartViewSet(viewsets.ModelViewSet):
    """ViewSet для корзины пользователя."""
    permission_classes = [IsAuthenticated]
    queryset = Cart.objects.all()
    serializer_class = CartSerializer

    def get_queryset(self) -> QuerySet:
        """
        Получить корзину текущего пользователя.

        Returns:
            QuerySet: Список товаров в корзине пользователя.
        """
        return Cart.objects.filter(user=self.request.user).select_related('sneaker', 'size')

    def get_serializer_context(self) -> dict:
        """
        Передача контекста сериализатору.

        Returns:
            dict: Контекст с объектом запроса.
        """
        return {'request': self.request}


class OrderItemViewSet(viewsets.ModelViewSet):
    """ViewSet для позиций заказа."""
    queryset = OrderItem.objects.select_related('sneaker', 'size', 'order')
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet для заказов."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self) -> QuerySet:
        """
        Получить список заказов текущего пользователя или всех заказов для админа.

        Returns:
            QuerySet: Список заказов.
        """
        user = self.request.user
        qs = Order.objects.select_related('user').prefetch_related('items').annotate(
            total_items=Sum('items__quantity')
        )
        if user.is_staff:
            return qs
        return qs.filter(user=user)

    def perform_create(self, serializer: OrderSerializer) -> None:
        """
        Создание заказа от имени текущего пользователя.

        Args:
            serializer: Сериализатор заказа.
        """
        serializer.save(user=self.request.user)

    def partial_update(self, request, *args: Any, **kwargs: Any) -> Response:
        """
        Частичное обновление заказа (например, изменение статуса).

        Returns:
            Response: Ответ с ошибкой или результатом обновления.
        """
        order = self.get_object()
        new_status = request.data.get('status')

        if new_status == 'cancelled' and order.status in ['shipped', 'delivered']:
            return Response(
                {'error': 'Нельзя отменить заказ, который уже отправлен или доставлен.'},
                status=status.HTTP_400_BAD_REQUEST)

        return super().partial_update(request, *args, **kwargs)

    def list(self, request, *args: Any, **kwargs: Any) -> Response:
        """
        Получить список заказов и общую выручку (для админа).

        Returns:
            Response: Список заказов и выручка.
        """
        response = super().list(request, *args, **kwargs)
        total_revenue = 0
        if request.user.is_staff:
            total_revenue = Order.objects.aggregate(total_revenue=Sum('total_price'))['total_revenue'] or 0

        response.data = {
            'total_revenue': total_revenue,
            'orders': response.data,
        }
        return response


class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet для отзывов."""
    serializer_class = ReviewSerializer
    queryset = Review.objects.select_related('user', 'sneaker')

    def perform_create(self, serializer: ReviewSerializer) -> None:
        """
        Присваивает пользователю созданный отзыв.

        Args:
            serializer: Сериализатор отзыва.
        """
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def average_rating(self, request) -> Response:
        """
        Получение среднего рейтинга по всем товарам или конкретному кроссовку.

        Returns:
            Response: Средний рейтинг.
        """
        sneaker_id = request.query_params.get('sneaker')

        if sneaker_id is not None:
            avg_rating = Review.objects.filter(sneaker=sneaker_id).aggregate(avg=Avg('rating'))
        else:
            avg_rating = Review.objects.aggregate(avg=Avg('rating'))

        return Response({'average_rating': round(avg_rating['avg'], 2) if avg_rating['avg'] is not None else None})


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet для платежей."""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class MainBannerViewSet(viewsets.ModelViewSet):
    """ViewSet для главного баннера."""
    queryset = MainBanner.objects.all()
    serializer_class = MainBannerSerializer


class PrivacyPolicyViewSet(viewsets.ModelViewSet):
    """ViewSet для политики конфиденциальности."""
    queryset = PrivacyPolicy.objects.all()
    serializer_class = PrivacyPolicySerializer


class FilterOptionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request) -> Response:
        """
        Получение доступных фильтров: бренды, категории, цвета, размеры, гендер.

        Returns:
            Response: Сериализованные данные фильтров.
        """
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
