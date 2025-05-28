from django.contrib import admin
from .models import *
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomGroup
from django.contrib.auth.admin import GroupAdmin
from .forms import CustomUserCreationForm, CustomUserChangeForm

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

    @admin.display(description='Item Count')
    def item_count(self, obj):
        return obj.items.count()

admin.site.register(Order, OrderAdmin)

# --- Review ---
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'sneaker', 'rating', 'created_at', 'short_comment')
    list_filter = ('created_at', 'rating')
    search_fields = ('user__username', 'sneaker__name', 'comment')
    list_display_links = ('user',)
    raw_id_fields = ('user', 'sneaker')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='Comment')
    def short_comment(self, obj):
        return (obj.comment[:30] + '...') if obj.comment and len(obj.comment) > 30 else obj.comment

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


class SneakerAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'category', 'price', 'created_at', 'updated_at', 'review_count')
    search_fields = ('name', 'brand__name', 'category__name')
    list_filter = ('brand', 'category', 'created_at')
    list_display_links = ('name', 'brand')
    raw_id_fields = ('brand', 'category')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    inlines = [StockInline]

    @admin.display(description='Review Count')
    def review_count(self, obj):
        return obj.review_set.count()

admin.site.register(Sneaker, SneakerAdmin)

@admin.register(CustomGroup)
class CustomGroupAdmin(GroupAdmin):
    pass

