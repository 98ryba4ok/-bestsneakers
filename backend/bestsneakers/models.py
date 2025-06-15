from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone
from django.urls import reverse
from django.contrib.auth.models import Group as AuthGroup
from django.core.validators import MinValueValidator, MaxValueValidator

class SneakerQuerySet(models.QuerySet):
    def available(self):
        return self.filter(stock__quantity__gt=0)

class SneakerManager(models.Manager):
    def get_queryset(self):
        return SneakerQuerySet(self.model, using=self._db)

    def available(self):
        return self.get_queryset().available()
class CustomGroup(AuthGroup):
    class Meta:
        proxy = True
        app_label = 'bestsneakers'
        verbose_name = 'Права'
        verbose_name_plural = 'Права'


class User(AbstractUser):
    phone = models.CharField(max_length=12, blank=True, null=True, verbose_name="Телефон")
    address = models.TextField(blank=True, null=True, verbose_name="Адрес")
    date_joined = models.DateTimeField(default=timezone.now, verbose_name="Дата регистрации")
    groups = models.ManyToManyField(Group, related_name="bestsneakers_users", blank=True, verbose_name="Группы")
    user_permissions = models.ManyToManyField(Permission, related_name="bestsneakers_users_permissions", blank=True, verbose_name="Разрешения")

    class Meta:
        ordering = ['username']
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return self.username


class Category(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название")
    slug = models.SlugField(unique=True, verbose_name="Слаг")

    class Meta:
        ordering = ['name']
        verbose_name = "Категория"
        verbose_name_plural = "Категории"

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название")
    country = models.CharField(max_length=100, blank=True, null=True, verbose_name="Страна")

    class Meta:
        ordering = ['name']
        verbose_name = "Бренд"
        verbose_name_plural = "Бренды"

    def __str__(self):
        return self.name


class Sneaker(models.Model):
    GENDER_CHOICES = [
        ('M', 'Мужской'),
        ('F', 'Женский'),
        ('U', 'Унисекс'),
    ]

    name = models.CharField(max_length=255, verbose_name="Название")
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='sneakers', verbose_name="Бренд")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='sneakers', verbose_name="Категория")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='U', verbose_name="Пол")
    color = models.CharField(max_length=100, verbose_name="Цвет", blank=True, null=True)
    sizes = models.ManyToManyField('Size', through='Stock', related_name='sneakers', verbose_name="Доступные размеры")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    objects = SneakerManager()

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Кроссовок"
        verbose_name_plural = "Кроссовки"

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('sneaker_detail', args=[str(self.id)])

class SneakerImage(models.Model):
    sneaker = models.ForeignKey(Sneaker, on_delete=models.CASCADE, related_name='images', verbose_name="Кроссовок")
    image = models.ImageField(upload_to='sneakers/', verbose_name="Изображение")
    is_main = models.BooleanField(default=False, verbose_name="Основное изображение")

    class Meta:
        verbose_name = "Изображение кроссовка"
        verbose_name_plural = "Изображения кроссовок"

    def __str__(self):
        return f"Изображение для {self.sneaker.name}"


class Size(models.Model):
    size = models.DecimalField(max_digits=4, decimal_places=1)

    class Meta:
        verbose_name = "Размер"
        verbose_name_plural = "Размеры"

    def __str__(self):
        return str(self.size)


class Stock(models.Model):
    sneaker = models.ForeignKey(Sneaker, on_delete=models.CASCADE, related_name='stock', verbose_name="Кроссовок")
    size = models.ForeignKey(Size, on_delete=models.CASCADE, verbose_name="Размер")
    quantity = models.PositiveIntegerField(verbose_name="Количество")
    date_added = models.DateTimeField(default=timezone.now, verbose_name="Дата добавления")

    class Meta:
        ordering = ['-date_added']
        verbose_name = "Склад"
        verbose_name_plural = "Склад"

    def __str__(self):
        return f"{self.sneaker.name} - {self.size.size} : {self.quantity} шт."


class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart', verbose_name="Пользователь")
    sneaker = models.ForeignKey(Sneaker, on_delete=models.CASCADE, verbose_name="Кроссовок")
    size = models.ForeignKey(Size, on_delete=models.CASCADE, verbose_name="Размер")
    quantity = models.PositiveIntegerField(verbose_name="Количество")
    added_at = models.DateTimeField(default=timezone.now, verbose_name="Дата добавления")

    class Meta:
        verbose_name = "Корзина"
        verbose_name_plural = "Корзины"

    def __str__(self):
        return f"Корзина пользователя {self.user.username}: {self.sneaker.name} ({self.size.size}) x {self.quantity}"


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name="Пользователь")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Общая сумма")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата создания")
    status = models.CharField(
        max_length=50,
        choices=[('pending', 'Ожидание'), ('shipped', 'Отправлен'), ('delivered', 'Доставлен')],
        verbose_name="Статус"
    )
    
    # ⬇️ Это ключевое добавление
    sneakers = models.ManyToManyField(
        'Sneaker',
        through='OrderItem',
        through_fields=('order', 'sneaker'),
        related_name='orders',
        verbose_name="Кроссовки в заказе"
    )

    class Meta:
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"

    def __str__(self):
        return f"Заказ #{self.id} от {self.created_at.date()} (Пользователь: {self.user.username})"

    

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="Заказ")
    sneaker = models.ForeignKey(Sneaker, on_delete=models.CASCADE, verbose_name="Кроссовки")
    size = models.ForeignKey(Size, on_delete=models.CASCADE, verbose_name="Размер")
    quantity = models.PositiveIntegerField(verbose_name="Количество")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена на момент покупки")

    class Meta:
        verbose_name = "Элемент заказа"
        verbose_name_plural = "Элементы заказа"

    def __str__(self):
        return f"{self.sneaker.name} ({self.size.size}) x {self.quantity}"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews', verbose_name="Пользователь")
    sneaker = models.ForeignKey(Sneaker, on_delete=models.CASCADE, related_name='reviews', verbose_name="Кроссовок")
    rating = models.PositiveIntegerField( 
        validators=[
            MinValueValidator(1, message="Рейтинг не может быть меньше 1."),
            MaxValueValidator(5, message="Рейтинг не может быть больше 5.")
        ],verbose_name="Рейтинг")
    text = models.TextField(verbose_name="Текст отзыва")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата создания")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"

    def __str__(self):
        return f"Отзыв от {self.user.username} на {self.sneaker.name} — {self.rating}★"


class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments', verbose_name="Заказ")
    payment_method = models.CharField(
        max_length=50,
        choices=[('card', 'Кредитная карта'), ('paypal', 'PayPal'), ('crypto', 'Криптовалюта')],
        verbose_name="Метод оплаты"
    )
    status = models.CharField(
        max_length=50,
        choices=[('pending', 'Ожидание'), ('completed', 'Завершен'), ('failed', 'Неудача')],
        verbose_name="Статус платежа"
    )
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата создания")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Платеж"
        verbose_name_plural = "Платежи"

    def __str__(self):
        return f"Платеж #{self.id} для заказа #{self.order.id} — {self.get_payment_method_display()} ({self.get_status_display()})"

class MainBanner(models.Model):
    title = models.CharField(max_length=100, verbose_name="Заголовок")
    image = models.ImageField(upload_to='main_image/', verbose_name="Изображение баннера")
    link = models.URLField(verbose_name="Ссылка при клике")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        verbose_name = "Главный баннер"
        verbose_name_plural = "Главные баннеры"

    def __str__(self):
        return self.title


class PrivacyPolicy(models.Model):
    title = models.CharField(max_length=100, default='Политика конфиденциальности', verbose_name="Название документа")
    file = models.FileField(upload_to='policies/', verbose_name="Файл политики (PDF)")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата загрузки")
    is_active = models.BooleanField(default=True, verbose_name="Текущая версия")

    class Meta:
        verbose_name = "Политика конфиденциальности"
        verbose_name_plural = "Политики конфиденциальности"

    def __str__(self):
        return f"{self.title} ({self.uploaded_at.date()})"
