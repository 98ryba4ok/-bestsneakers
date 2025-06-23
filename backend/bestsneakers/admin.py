from django.contrib import admin
from .models import *
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomGroup
from django.contrib.auth.admin import GroupAdmin
from .forms import CustomUserCreationForm, CustomUserChangeForm
from django.utils.safestring import mark_safe
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from io import BytesIO

# --- User ---
class UserAdmin(BaseUserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    list_display = ('username', 'phone', 'address', 'date_joined', 'group_names')
    search_fields = ('username', 'phone', 'address')
    list_filter = ('date_joined', 'groups')
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
    def group_names(self, obj):
        return ", ".join([g.name for g in obj.groups.all()])



admin.site.register(User, UserAdmin)

# --- Category ---
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'sneaker_count')
    search_fields = ('name', 'slug')
    list_filter = ('name',)
    list_display_links = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    date_hierarchy = None

    @admin.display(description='Sneaker Count')
    def sneaker_count(self, obj):
        return obj.sneakers.count()

admin.site.register(Category, CategoryAdmin)

# --- Brand ---
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'sneaker_count')
    search_fields = ('name', 'country')
    list_filter = ('country',)
    list_display_links = ('name',)
    date_hierarchy = None

    @admin.display(description='Sneaker Count')
    def sneaker_count(self, obj):
           return obj.sneakers.count()

admin.site.register(Brand, BrandAdmin)

# --- Size ---
class SizeAdmin(admin.ModelAdmin):
    list_display = ['size']

admin.site.register(Size, SizeAdmin)

# --- Stock ---
class StockAdmin(admin.ModelAdmin):
    list_display = ('sneaker', 'size', 'quantity', 'date_added', 'is_low')
    list_filter = ('date_added', 'quantity')
    search_fields = ('sneaker__name', 'size__size')
    list_display_links = ('sneaker',)
    raw_id_fields = ('sneaker', 'size')
    readonly_fields = ('date_added',)
    date_hierarchy = 'date_added'

    @admin.display(boolean=True, description='Low Stock')
    def is_low(self, obj):
        return obj.quantity < 5

admin.site.register(Stock, StockAdmin)

# --- Cart ---
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'sneaker', 'size', 'quantity', 'added_at', 'cart_total')
    list_filter = ('added_at',)
    search_fields = ('user__username', 'sneaker__name')
    list_display_links = ('user',)
    raw_id_fields = ('user', 'sneaker', 'size')
    readonly_fields = ('added_at',)
    date_hierarchy = 'added_at'

    @admin.display(description='Cart Total')
    def cart_total(self, obj):
        return obj.sneaker.price * obj.quantity if obj.sneaker else 0

admin.site.register(Cart, CartAdmin)

# --- OrderItem Inline ---
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    raw_id_fields = ('sneaker', 'size')

# --- Order ---
class OrderAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_price', 'created_at', 'status', 'item_count')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username',)
    list_display_links = ('user',)
    raw_id_fields = ('user',)
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline]
    actions = ['download_orders_pdf']  # 👈 Добавили действие

    @admin.display(description='Item Count')
    def item_count(self, obj):
        return obj.items.count()

    def download_orders_pdf(self, request, queryset):
        buffer = BytesIO()
        p = canvas.Canvas(buffer)

        y = 800
        for order in queryset:
            p.drawString(100, y, f"Order ID: {order.id}, User: {order.user.username}, Total: {order.total_price}₽")
            y -= 20
            for item in order.items.all():
                p.drawString(120, y, f"- {item.sneaker.name}, Size: {item.size}, Qty: {item.quantity}")
                y -= 15
            y -= 10
            if y < 100:
                p.showPage()
                y = 800

        p.showPage()
        p.save()

        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')

    download_orders_pdf.short_description = "Скачать выбранные заказы в PDF"

admin.site.register(Order, OrderAdmin)



# --- Review ---
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'sneaker', 'rating', 'created_at', 'short_comment')
    list_filter = ('created_at', 'rating')
    search_fields = ('user__username', 'sneaker__name', 'text')
    list_display_links = ('user',)
    raw_id_fields = ('user', 'sneaker')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='Comment')
    def short_comment(self, obj):
        return (obj.text[:30] + '...') if obj.text and len(obj.text) > 30 else obj.text

    

admin.site.register(Review, ReviewAdmin)

# --- Payment ---
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'payment_method', 'status', 'created_at', 'order_user')
    list_filter = ('status', 'created_at', 'payment_method')
    search_fields = ('order__user__username',)
    list_display_links = ('order',)
    raw_id_fields = ('order',)
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='Order User')
    def order_user(self, obj):
        return obj.order.user.username if obj.order and obj.order.user else '-'

admin.site.register(Payment, PaymentAdmin)

class StockInline(admin.TabularInline):
    model = Stock
    extra = 1
    raw_id_fields = ('size',)

class SneakerImageInline(admin.TabularInline):
    model = SneakerImage
    extra = 3  # количество пустых форм по умолчанию

class SneakerAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'category', 'price', 'created_at', 'updated_at', 'review_count')
    search_fields = ('name', 'brand__name', 'category__name')
    list_filter = ('brand', 'category', 'created_at')
    list_display_links = ('name', 'brand')
    raw_id_fields = ('brand', 'category')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    inlines = [StockInline,SneakerImageInline]

    @admin.display(description='Review Count')
    def review_count(self, obj):
        return obj.reviews.count()

admin.site.register(Sneaker, SneakerAdmin)

# --- Main Banner ---
class MainBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at', 'preview')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'link')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='Preview')
    def preview(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" width="100" height="50" style="object-fit:cover;" />')
        return "No image"

admin.site.register(MainBanner, MainBannerAdmin)


@admin.register(CustomGroup)
class CustomGroupAdmin(GroupAdmin):
    pass

# --- Privacy Policy ---
class PrivacyPolicyAdmin(admin.ModelAdmin):
    list_display = ('title', 'uploaded_at', 'is_active')
    search_fields = ('title',)
    list_filter = ('is_active', 'uploaded_at')
    list_display_links = ('title',)
    readonly_fields = ('uploaded_at',)
    date_hierarchy = 'uploaded_at'

admin.site.register(PrivacyPolicy, PrivacyPolicyAdmin)


@admin.register(elexam)
class ehexamAdmin(admin.ModelAdmin):
    list_display = ('name', 'exam_date', 'created_at', 'is_public')
    list_filter = ('is_public', 'created_at', 'exam_date')
    search_fields = ('name', 'participants__email')
    filter_horizontal = ('participants',)