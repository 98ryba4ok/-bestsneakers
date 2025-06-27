# Django imports
from django.contrib import admin
from django.conf import settings
from django.http import HttpResponse
from django.utils.safestring import mark_safe
from django.utils.timezone import localtime
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin, GroupAdmin
from django.contrib.auth.models import Group

# Project imports
from .models import *
from .forms import CustomUserCreationForm, CustomUserChangeForm

# ReportLab imports
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

# Standard library
from io import BytesIO
from typing import Any
import os

# ---------------------- User ----------------------
class UserAdmin(BaseUserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    list_display = ('username', 'phone', 'address', 'date_joined', 'group_names')
    list_filter = ('date_joined', 'groups')
    search_fields = ('username', 'phone', 'address')
    list_display_links = ('username',)
    readonly_fields = ('date_joined',)
    filter_horizontal = ('groups', 'user_permissions')
    date_hierarchy = 'date_joined'

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Личная информация', {'fields': ('first_name', 'last_name', 'email', 'phone', 'address')}),
        ('Права и группы', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'first_name', 'last_name', 'email', 'phone', 'address', 'password1', 'password2'),
        }),
    )

    @admin.display(description='Groups')
    def group_names(self, obj: Any) -> str:
        return ", ".join(group.name for group in obj.groups.all())

admin.site.register(User, UserAdmin)

# ---------------------- Category ----------------------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'sneaker_count')
    search_fields = ('name', 'slug')
    list_filter = ('name',)
    list_display_links = ('name',)
    prepopulated_fields = {'slug': ('name',)}

    @admin.display(description='Sneaker Count')
    def sneaker_count(self, obj: Any) -> int:
        return obj.sneakers.count()

# ---------------------- Brand ----------------------
@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'sneaker_count')
    search_fields = ('name', 'country')
    list_filter = ('country',)
    list_display_links = ('name',)

    @admin.display(description='Sneaker Count')
    def sneaker_count(self, obj: Any) -> int:
        return obj.sneakers.count()

# ---------------------- Size ----------------------
@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ['size']

# ---------------------- Stock ----------------------
@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('sneaker', 'size', 'quantity', 'date_added', 'is_low')
    list_filter = ('date_added', 'quantity')
    search_fields = ('sneaker__name', 'size__size')
    list_display_links = ('sneaker',)
    raw_id_fields = ('sneaker', 'size')
    readonly_fields = ('date_added',)
    date_hierarchy = 'date_added'

    @admin.display(boolean=True, description='Low Stock')
    def is_low(self, obj: Any) -> bool:
        return obj.quantity < 5

# ---------------------- Cart ----------------------
@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'sneaker', 'size', 'quantity', 'added_at', 'cart_total')
    list_filter = ('added_at',)
    search_fields = ('user__username', 'sneaker__name')
    list_display_links = ('user',)
    raw_id_fields = ('user', 'sneaker', 'size')
    readonly_fields = ('added_at',)
    date_hierarchy = 'added_at'

    @admin.display(description='Cart Total')
    def cart_total(self, obj: Any) -> float:
        return obj.sneaker.price * obj.quantity if obj.sneaker else 0.0

# ---------------------- Order ----------------------
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    raw_id_fields = ('sneaker', 'size')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_price', 'created_at', 'status', 'item_count')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username',)
    list_display_links = ('user',)
    raw_id_fields = ('user',)
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline]
    actions = ['download_orders_pdf']

    @admin.display(description='Item Count')
    def item_count(self, obj: Any) -> int:
        return obj.items.count()

    def download_orders_pdf(self, request, queryset):
        if not queryset:
            self.message_user(request, "Нет выбранных заказов для скачивания.")
            return HttpResponse(status=204)

        font_path = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'arabee.ttf')
        font_name = 'Arabee'

        if font_name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(font_name, font_path))

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()

        styles.add(ParagraphStyle(name='CustomNormal', fontName=font_name, fontSize=10))
        styles.add(ParagraphStyle(name='CustomHeading1', fontName=font_name, fontSize=14, leading=16, spaceAfter=10))

        elements = []

        for order in queryset:
            elements += [
                Paragraph(f"Заказ №{order.id}", styles['CustomHeading1']),
                Paragraph(f"Пользователь: {order.user.username}", styles['CustomNormal']),
                Spacer(1, 12)
            ]

            data = [["Товар", "Размер", "Кол-во", "Цена", "Сумма"]]
            for item in order.items.all():
                data.append([
                    item.sneaker.name,
                    str(item.size),
                    str(item.quantity),
                    f"{item.sneaker.price:.2f}₽",
                    f"{item.sneaker.price * item.quantity:.2f}₽"
                ])

            table = Table(data)
            table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), font_name),
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ]))
            elements += [table, Spacer(1, 24)]

        doc.build(elements)
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')

    download_orders_pdf.short_description = "Скачать выбранные заказы в PDF"

# ---------------------- Review ----------------------
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'sneaker', 'rating', 'created_at', 'short_comment')
    list_filter = ('created_at', 'rating')
    search_fields = ('user__username', 'sneaker__name', 'text')
    list_display_links = ('user',)
    raw_id_fields = ('user', 'sneaker')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='Comment')
    def short_comment(self, obj: Any) -> str:
        return f"{obj.text[:30]}..." if obj.text and len(obj.text) > 30 else obj.text

# ---------------------- Payment ----------------------
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'payment_method', 'status', 'created_at', 'order_user')
    list_filter = ('status', 'created_at', 'payment_method')
    search_fields = ('order__user__username',)
    list_display_links = ('order',)
    raw_id_fields = ('order',)
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='Order User')
    def order_user(self, obj: Any) -> str:
        return obj.order.user.username if obj.order and obj.order.user else '-'

# ---------------------- Sneaker ----------------------
class StockInline(admin.TabularInline):
    model = Stock
    extra = 1
    raw_id_fields = ('size',)

class SneakerImageInline(admin.TabularInline):
    model = SneakerImage
    extra = 3

@admin.register(Sneaker)
class SneakerAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'category', 'price', 'created_at', 'updated_at', 'review_count')
    search_fields = ('name', 'brand__name', 'category__name')
    list_filter = ('brand', 'category', 'created_at')
    list_display_links = ('name', 'brand')
    raw_id_fields = ('brand', 'category')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    inlines = [StockInline, SneakerImageInline]

    @admin.display(description='Review Count')
    def review_count(self, obj: Any) -> int:
        return obj.reviews.count()

# ---------------------- Main Banner ----------------------
@admin.register(MainBanner)
class MainBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at', 'preview')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'link')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='Preview')
    def preview(self, obj: Any) -> str:
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" width="100" height="50" style="object-fit:cover;" />')
        return "No image"

# ---------------------- Privacy Policy ----------------------
@admin.register(PrivacyPolicy)
class PrivacyPolicyAdmin(admin.ModelAdmin):
    list_display = ('title', 'uploaded_at', 'is_active')
    search_fields = ('title',)
    list_filter = ('is_active', 'uploaded_at')
    list_display_links = ('title',)
    readonly_fields = ('uploaded_at',)
    date_hierarchy = 'uploaded_at'

# ---------------------- Custom Group ----------------------
@admin.register(CustomGroup)
class CustomGroupAdmin(GroupAdmin):
    pass
