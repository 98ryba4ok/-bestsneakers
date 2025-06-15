from rest_framework import serializers
from .models import (
     Category, Brand, Sneaker, Size, Stock, Cart, Order,
    OrderItem, Review, Payment, MainBanner, PrivacyPolicy, SneakerImage
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

    class Meta:
        model = Sneaker
        fields = '__all__'

    def get_sizes(self, obj):
        sizes = obj.sizes.all().order_by('size')  # сортировка по числовому значению
        return SizeSerializer(sizes, many=True).data







class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'


class CartSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField() 
    class Meta:
        model = Cart
        fields = '__all__'  # или перечисли явно
        read_only_fields = ('user',)
        

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # вложенный пользователь

    class Meta:
        model = Review
        fields = ['id', 'rating', 'text', 'created_at', 'user', 'sneaker']


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

class MainBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainBanner
        fields = '__all__'