from decimal import Decimal
from typing import Optional
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from .models import User, Category, Brand, Sneaker, Size, Stock, Order, Review

User = get_user_model()


class OrderModelValidationTests(TestCase):
    def setUp(self) -> None:
        """
        Создаёт тестового пользователя для проверки модели заказа.
        """
        self.user = User.objects.create_user(username='testuser', password='password123')

    def test_order_total_price_cannot_be_zero(self) -> None:
        """
        Проверяет, что при total_price == 0 выбрасывается ValidationError.
        """
        order = Order(
            user=self.user,
            total_price=Decimal('0.00'),
            full_name='Иван Иванов',
            phone='+79991234567',
            address='Москва, ул. Тестовая, д.1',
            status='pending'
        )
        with self.assertRaises(ValidationError) as context:
            order.full_clean()
        self.assertIn('total_price', context.exception.message_dict)

    def test_order_total_price_cannot_be_negative(self) -> None:
        """
        Проверяет, что при total_price < 0 выбрасывается ValidationError.
        """
        order = Order(
            user=self.user,
            total_price=Decimal('-10.00'),
            full_name='Иван Иванов',
            phone='+79991234567',
            address='Москва, ул. Тестовая, д.1',
            status='pending'
        )
        with self.assertRaises(ValidationError) as context:
            order.full_clean()
        self.assertIn('total_price', context.exception.message_dict)


class SneakerAPITests(TestCase):
    def setUp(self) -> None:
        """
        Настраивает тестовый клиент и необходимые объекты для тестирования API кроссовок.
        """
        self.client = APIClient()
        self.brand = Brand.objects.create(name="TestBrand")
        self.category = Category.objects.create(name="TestCategory", slug="test-category")
        self.sneaker1 = Sneaker.objects.create(name="Sneaker 1", brand=self.brand, category=self.category, price=100)
        self.sneaker2 = Sneaker.objects.create(name="Sneaker 2", brand=self.brand, category=self.category, price=150)

    def test_sneaker_list_returns_all(self) -> None:
        """
        Проверяет, что API возвращает все созданные кроссовки.
        """
        url = reverse('sneaker-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 2)
        names = [item['name'] for item in data]
        self.assertIn("Sneaker 1", names)
        self.assertIn("Sneaker 2", names)


class SneakerShopTests(APITestCase):
    def setUp(self) -> None:
        """
        Создаёт аутентифицированного пользователя, категории, бренд, кроссовок, размер и запас на складе.
        """
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name='Кроссовки')
        self.brand = Brand.objects.create(name='Nike')
        self.sneaker = Sneaker.objects.create(name="Sneaker 1", brand=self.brand, category=self.category, price=100)
        self.size = Size.objects.create(size=42)
        Stock.objects.create(sneaker=self.sneaker, size=self.size, quantity=10)

    def test_add_sneaker_to_cart(self) -> None:
        """
        Проверяет успешное добавление кроссовка в корзину через API.
        """
        url = reverse('cart-list')
        data = {
            "sneaker": self.sneaker.id,
            "size_id": self.size.id,
            "quantity": 2
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['sneaker'], self.sneaker.id)
        self.assertEqual(response.data['quantity'], 2)

    def test_create_order(self) -> None:
        """
        Проверяет создание заказа на основе содержимого корзины.
        """
        cart_url = reverse('cart-list')
        self.client.post(cart_url, {
            "sneaker": self.sneaker.id,
            "size_id": self.size.id,
            "quantity": 1
        }, format='json')

        order_url = reverse('checkout-list')
        order_data = {
            "full_name": "Иван Иванов",
            "phone": "+79991234567",
            "address": "ул. Тестовая, д.1",
            "payment_method": "card"
        }
        response = self.client.post(order_url, order_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order_id: int = response.data['order_id']
        order: Order = Order.objects.get(id=order_id)
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.status, 'pending')

    def test_filter_sneakers_by_category(self) -> None:
        """
        Проверяет фильтрацию списка кроссовок по категории.
        """
        url = reverse('sneaker-list')
        response = self.client.get(url, {'category': self.category.id})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for item in data:
            self.assertEqual(item['category'], self.category.id)


class UserModelTest(TestCase):
    def test_create_user(self) -> None:
        """
        Проверяет создание пользователя и корректность строкового представления.
        """
        user = User.objects.create_user(username='testuser', password='pass123')
        self.assertEqual(str(user), 'testuser')
        self.assertIsNotNone(user.date_joined)


class CategoryModelTest(TestCase):
    def test_str_and_ordering(self) -> None:
        """
        Проверяет строковое представление и порядок сортировки категорий.
        """
        c1 = Category.objects.create(name="Alpha", slug="alpha")
        c2 = Category.objects.create(name="Beta", slug="beta")
        self.assertEqual(str(c1), "Alpha")
        qs = Category.objects.all()
        self.assertEqual(list(qs), [c1, c2]) 


class BrandModelTest(TestCase):
    def test_str_and_ordering(self) -> None:
        """
        Проверяет строковое представление и порядок сортировки брендов.
        """
        b1 = Brand.objects.create(name="Nike")
        b2 = Brand.objects.create(name="Adidas")
        self.assertEqual(str(b1), "Nike")
        qs = Brand.objects.all()
        self.assertEqual(list(qs), sorted([b1, b2], key=lambda x: x.name))


class SneakerModelTest(TestCase):
    def setUp(self) -> None:
        """
        Создаёт объекты для тестирования модели кроссовок и размеров.
        """
        self.brand = Brand.objects.create(name="Nike")
        self.category = Category.objects.create(name="Running", slug="running")
        self.size_42 = Size.objects.create(size=42)
        self.size_43 = Size.objects.create(size=43)

    def test_available_manager(self) -> None:
        """
        Проверяет работу менеджера available, который должен возвращать только кроссовки с доступным складом.
        """
        sneaker1 = Sneaker.objects.create(name="S1", brand=self.brand, category=self.category, price=100, gender='U')
        sneaker2 = Sneaker.objects.create(name="S2", brand=self.brand, category=self.category, price=150, gender='U')

        Stock.objects.create(sneaker=sneaker1, size=self.size_42, quantity=5)
        Stock.objects.create(sneaker=sneaker2, size=self.size_43, quantity=0)

        available = Sneaker.objects.available()
        self.assertIn(sneaker1, available)
        self.assertNotIn(sneaker2, available)


class StockModelTest(TestCase):
    def setUp(self) -> None:
        """
        Создаёт объекты для тестирования модели склада.
        """
        self.brand = Brand.objects.create(name="Nike")
        self.category = Category.objects.create(name="Casual", slug="casual")
        self.sneaker = Sneaker.objects.create(name="TestSneaker", brand=self.brand, category=self.category, price=100, gender='U')
        self.size = Size.objects.create(size=40)

    def test_str(self) -> None:
        """
        Проверяет корректность строкового представления объекта Stock.
        """
        stock = Stock.objects.create(sneaker=self.sneaker, size=self.size, quantity=7)
        self.assertEqual(str(stock), f"{self.sneaker.name} - {self.size.size} : 7 шт.")


class OrderModelTest(TestCase):
    def setUp(self) -> None:
        """
        Создаёт пользователя, бренд, категорию, кроссовок и размер для тестов модели заказа.
        """
        self.user = User.objects.create_user(username='user1', password='pass')
        self.brand = Brand.objects.create(name="Nike")
        self.category = Category.objects.create(name="Casual", slug="casual")
        self.sneaker = Sneaker.objects.create(name="TestSneaker", brand=self.brand, category=self.category, price=100, gender='U')
        self.size = Size.objects.create(size=40)

    def test_order_str_and_clean(self) -> None:
        """
        Проверяет строковое представление заказа и валидацию total_price.
        """
        order = Order(
            user=self.user,
            total_price=Decimal('150.00'),
            full_name='John Doe',
            phone='1234567890',
            address='Test Address',
            status='pending'
        )
        order.full_clean()  # Не должно вызывать исключений
        order.save()
        self.assertTrue(str(order).startswith("Заказ #"))

        order_bad = Order(
            user=self.user,
            total_price=Decimal('0'),
            full_name='Jane Doe',
            phone='1234567890',
            address='Address',
            status='pending'
        )
        with self.assertRaises(ValidationError):
            order_bad.full_clean()


class ReviewModelTest(TestCase):
    def setUp(self) -> None:
        """
        Создаёт пользователя, бренд, категорию и кроссовок для тестирования отзывов.
        """
        self.user = User.objects.create_user(username='reviewer')
        self.brand = Brand.objects.create(name="Nike")
        self.category = Category.objects.create(name="Casual", slug="casual")
        self.sneaker = Sneaker.objects.create(name="SneakReview", brand=self.brand, category=self.category, price=50, gender='U')

    def test_review_rating_validation(self) -> None:
        """
        Проверяет валидацию рейтинга отзыва (должен быть от 1 до 5).
        """
        review = Review(
            user=self.user,
            sneaker=self.sneaker,
            rating=5,
            text="Great shoes!"
        )
        review.full_clean()  # не должно выбрасывать

        review.rating = 0
        with self.assertRaises(ValidationError):
            review.full_clean()

        review.rating = 6
        with self.assertRaises(ValidationError):
            review.full_clean()

    def test_str(self) -> None:
        """
        Проверяет строковое представление объекта Review.
        """
        review = Review.objects.create(user=self.user, sneaker=self.sneaker, rating=4, text="Nice!")
        self.assertIn("reviewer", str(review))
        self.assertIn("SneakReview", str(review))
        self.assertIn("4★", str(review))
