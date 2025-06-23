from rest_framework import serializers
from decimal import Decimal
from django.db import transaction

from .models import (
     Category, Brand, Sneaker, Size, Stock, Cart, Order,
    OrderItem, Review, Payment, MainBanner, PrivacyPolicy, SneakerImage, Stock, elexam
)
from users.serializers import UserSerializer 

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class SneakerImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = SneakerImage
        fields = ['id', 'image', 'is_main']

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'
        
class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = '__all__'

class SneakerSerializer(serializers.ModelSerializer):
    avg_rating = serializers.FloatField(read_only=True)
    images = SneakerImageSerializer(many=True, read_only=True)
    sizes = serializers.SerializerMethodField()
    sold_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Sneaker
        fields = '__all__'
    def get_sizes(self, obj):
        stocks = obj.stock.filter(quantity__gt=0).select_related('size')
        sizes = [stock.size for stock in stocks]
        return SizeSerializer(sorted(sizes, key=lambda s: s.size), many=True).data


class CheckoutSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=500)
    
    payment_method = serializers.ChoiceField(
        choices=[('card', 'Карта'), ('paypal', 'PayPal'), ('crypto', 'Криптовалюта')],
        required=True
    )

    def validate(self, data):
        user = self.context['request'].user
        cart_items = Cart.objects.filter(user=user).select_related('sneaker', 'size')

        if not cart_items.exists():
            raise serializers.ValidationError("Корзина пуста")

        self.cart_items = cart_items
        self.total_price = sum(
            Decimal(item.sneaker.price) * item.quantity for item in cart_items
        )
        return data

    def create(self, validated_data):
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
    class Meta:
        model = Stock
        fields = '__all__'


class CartSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    size_id = serializers.PrimaryKeyRelatedField(source='size', queryset=Size.objects.all(), write_only=True)
    id = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ['id', 'sneaker', 'size', 'size_id', 'quantity', 'user']
        read_only_fields = ('user',)

    def validate(self, data):
        sneaker = data['sneaker']
        size = data['size']
        quantity = data['quantity']

        try:
            stock = Stock.objects.get(sneaker=sneaker, size=size)
        except Stock.DoesNotExist:
            raise serializers.ValidationError(f"Кроссовки {sneaker.name} размер {size.size} отсутствуют на складе.")

        # проверяем общее количество с учётом уже имеющегося в корзине
        user = self.context['request'].user
        existing = Cart.objects.filter(user=user, sneaker=sneaker, size=size).first()
        total_quantity = quantity
        if existing:
            total_quantity += existing.quantity

        if total_quantity > stock.quantity:
            raise serializers.ValidationError(
                f"В наличии только {stock.quantity} пары {sneaker.name} {size.size} EU размера"
            )

        return data

    def create(self, validated_data):
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
    size = serializers.SerializerMethodField()
    sneaker = SneakerSerializer(read_only=True)  # если ты выводишь имя и картинку
    
    class Meta:
        model = OrderItem
        fields = ['id', 'sneaker', 'size', 'quantity', 'price']

    def get_size(self, obj):
        return str(obj.size)  # или obj.size.size, если поле называется так



class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'rating', 'text', 'created_at', 'user', 'sneaker']

    def validate(self, data):
        user = self.context['request'].user
        sneaker = data.get('sneaker')

        # Проверяем, есть ли у пользователя заказ, содержащий этот кроссовок
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
    class Meta:
        model = Payment
        fields = '__all__'


class MainBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainBanner
        fields = '__all__'


class PrivacyPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivacyPolicy
        fields = '__all__'

        
class FilterOptionsSerializer(serializers.Serializer):
    brands = serializers.ListField(child=serializers.CharField())
    categories = serializers.ListField(child=serializers.CharField())
    colors = serializers.ListField(child=serializers.CharField())
    genders = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )
    sizes = serializers.ListField(child=serializers.CharField())

class ElexamSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)

    class Meta:
        model = elexam
        fields = '__all__'
