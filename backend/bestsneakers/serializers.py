from rest_framework import serializers
from decimal import Decimal
from django.db import transaction

from .models import (
    Category, Brand, Sneaker, Size, Stock, Cart, Order,
    OrderItem, Review, Payment, MainBanner, PrivacyPolicy, SneakerImage
)
from users.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий кроссовок."""
    class Meta:
        model = Category
        fields = '__all__'


class SneakerImageSerializer(serializers.ModelSerializer):
    """Сериализатор изображений кроссовок."""
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = SneakerImage
        fields = ['id', 'image', 'is_main']


class BrandSerializer(serializers.ModelSerializer):
    """Сериализатор брендов."""
    class Meta:
        model = Brand
        fields = '__all__'


class SizeSerializer(serializers.ModelSerializer):
    """Сериализатор размеров кроссовок."""
    class Meta:
        model = Size
        fields = '__all__'


class SneakerSerializer(serializers.ModelSerializer):
    """Сериализатор кроссовок с дополнительными полями и вложенными сериализаторами."""
    avg_rating = serializers.FloatField(read_only=True)
    images = SneakerImageSerializer(many=True, read_only=True)
    sizes = serializers.SerializerMethodField()
    sold_count = serializers.IntegerField(read_only=True)

    brand = BrandSerializer(read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source='brand', write_only=True
    )
    gender = serializers.ChoiceField(choices=Sneaker.GENDER_CHOICES)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = Sneaker
        fields = [
            'id', 'name', 'price', 'description', 'avg_rating', 'images', 'sizes',
            'sold_count', 'brand', 'brand_id', 'category', 'category_id', 'gender'
        ]

    def get_sizes(self, obj: Sneaker) -> list:
        """
        Получение размеров с положительным количеством на складе.

        Args:
            obj (Sneaker): Объект кроссовка.

        Returns:
            list: Список сериализованных размеров.
        """
        stocks = obj.stock.filter(quantity__gt=0).select_related('size')
        sizes = [stock.size for stock in stocks]
        return SizeSerializer(sorted(sizes, key=lambda s: s.size), many=True).data


class CheckoutSerializer(serializers.Serializer):
    """Сериализатор оформления заказа."""
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=500)
    payment_method = serializers.ChoiceField(
        choices=[('card', 'Карта'), ('paypal', 'PayPal'), ('crypto', 'Криптовалюта')],
        required=True
    )

    def validate(self, data: dict) -> dict:
        """
        Валидация корзины пользователя.

        Args:
            data (dict): Входные данные.

        Returns:
            dict: Валидированные данные.
        """
        user = self.context['request'].user
        cart_items = Cart.objects.filter(user=user).select_related('sneaker', 'size')

        if not cart_items.exists():
            raise serializers.ValidationError("Корзина пуста")

        self.cart_items = cart_items
        self.total_price = sum(
            Decimal(item.sneaker.price) * item.quantity for item in cart_items
        )
        return data

    def create(self, validated_data: dict) -> Order:
        """
        Создание заказа и проведение транзакции.

        Args:
            validated_data (dict): Валидированные данные заказа.

        Returns:
            Order: Созданный заказ.
        """
        user = self.context['request'].user
        payment_method = validated_data['payment_method']
        full_name = validated_data['full_name']
        phone = validated_data['phone']
        address = validated_data['address']

        with transaction.atomic():
            order = Order.objects.create(
                user=user,
                total_price=self.total_price,
                status='pending',
                full_name=full_name,
                phone=phone,
                address=address,
            )

            for item in self.cart_items:
                stock = Stock.objects.select_for_update().filter(
                    sneaker=item.sneaker,
                    size=item.size
                ).first()

                if not stock:
                    raise serializers.ValidationError(
                        f"Нет в наличии: {item.sneaker.name} размер {item.size.size}"
                    )

                if stock.quantity < item.quantity:
                    raise serializers.ValidationError(
                        f"Недостаточно на складе: {item.sneaker.name} размер {item.size.size}"
                    )

                stock.quantity -= item.quantity
                stock.save()

                OrderItem.objects.create(
                    order=order,
                    sneaker=item.sneaker,
                    size=item.size,
                    quantity=item.quantity,
                    price=item.sneaker.price
                )

            Payment.objects.create(
                order=order,
                payment_method=payment_method,
                status='pending'
            )

            self.cart_items.delete()
            return order


class StockSerializer(serializers.ModelSerializer):
    """Сериализатор складских остатков."""
    class Meta:
        model = Stock
        fields = 'id', 'quantity', 'sneaker', 'size'


class CartSerializer(serializers.ModelSerializer):
    """Сериализатор корзины пользователя."""
    size = SizeSerializer(read_only=True)
    size_id = serializers.PrimaryKeyRelatedField(source='size', queryset=Size.objects.all(), write_only=True)
    id = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ['id', 'sneaker', 'size', 'size_id', 'quantity', 'user']
        read_only_fields = ('user',)
    
    def validate(self, data: dict) -> dict:
        sneaker = data.get('sneaker') or getattr(self.instance, 'sneaker', None)
        size = data.get('size') or getattr(self.instance, 'size', None)
        quantity = data.get('quantity') or getattr(self.instance, 'quantity', None)

        # Если PATCH и обновляется только quantity — sneaker и size не передаются, но должны быть в instance
        if not sneaker or not size:
            raise serializers.ValidationError("Невозможно определить товар или размер.")

        try:
            stock = Stock.objects.get(sneaker=sneaker, size=size)
        except Stock.DoesNotExist:
            raise serializers.ValidationError(f"Кроссовки {sneaker.name} размер {size.size} отсутствуют на складе.")

        user = self.context['request'].user
        existing = Cart.objects.filter(user=user, sneaker=sneaker, size=size).first()
        
        # В случае PATCH — избежать удвоения количества
        if self.instance:
            total_quantity = quantity
        else:
            total_quantity = quantity + (existing.quantity if existing else 0)

        if total_quantity > stock.quantity:
            raise serializers.ValidationError(
                f"В наличии только {stock.quantity} пары {sneaker.name} {size.size} EU размера"
            )

        return data


    def create(self, validated_data: dict) -> Cart:
        print("CREATE DATA:", validated_data)
        """
        Создание или обновление записи в корзине.

        Args:
            validated_data (dict): Валидированные данные.

        Returns:
            Cart: Объект корзины.
        """
        validated_data['user'] = self.context['request'].user
        user = validated_data['user']
        sneaker = validated_data['sneaker']
        size = validated_data['size']
        

        existing = Cart.objects.filter(user=user, sneaker=sneaker, size=size).first()

        if existing:
            existing.quantity += validated_data['quantity']
            existing.save()
            return existing

        return super().create(validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    """Сериализатор элемента заказа."""
    size = serializers.SerializerMethodField()
    sneaker = SneakerSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'sneaker', 'size', 'quantity', 'price']

    def get_size(self, obj: OrderItem) -> str:
        """
        Получение текстового представления размера.

        Args:
            obj (OrderItem): Элемент заказа.

        Returns:
            str: Размер обуви.
        """
        return str(obj.size)


class OrderSerializer(serializers.ModelSerializer):
    """Сериализатор заказа."""
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['id', 'user', 'items', 'total_price', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    """Сериализатор отзывов кроссовок."""
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'rating', 'text', 'created_at', 'user', 'sneaker']

    def validate(self, data: dict) -> dict:
        """
        Проверка наличия заказа и уникальности отзыва.

        Args:
            data (dict): Данные отзыва.

        Returns:
            dict: Валидированные данные.
        """
        user = self.context['request'].user
        sneaker = data.get('sneaker')

        has_ordered = OrderItem.objects.filter(
            order__user=user,
            sneaker=sneaker
        ).exists()

        if not has_ordered:
            raise serializers.ValidationError("Вы можете оставить отзыв только на кроссовки, которые покупали.")

        if Review.objects.filter(user=user, sneaker=sneaker).exists():
            raise serializers.ValidationError("Вы уже оставляли отзыв на эти кроссовки.")

        return data


class PaymentSerializer(serializers.ModelSerializer):
    """Сериализатор платежей."""
    class Meta:
        model = Payment
        fields = '__all__'


class MainBannerSerializer(serializers.ModelSerializer):
    """Сериализатор главного баннера."""
    class Meta:
        model = MainBanner
        fields = '__all__'


class PrivacyPolicySerializer(serializers.ModelSerializer):
    """Сериализатор политики конфиденциальности."""
    class Meta:
        model = PrivacyPolicy
        fields = '__all__'


class FilterOptionsSerializer(serializers.Serializer):
    """Сериализатор фильтров для поиска кроссовок."""
    brands = serializers.ListField(child=serializers.CharField())
    categories = serializers.ListField(child=serializers.CharField())
    colors = serializers.ListField(child=serializers.CharField())
    genders = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )
    sizes = serializers.ListField(child=serializers.CharField())
