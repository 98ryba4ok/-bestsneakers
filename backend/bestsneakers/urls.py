from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
import debug_toolbar

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'sneakers', SneakerViewSet)
router.register(r'sizes', SizeViewSet)
router.register(r'stock', StockViewSet)
router.register(r'cart', CartViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'banners', MainBannerViewSet)
router.register(r'policies', PrivacyPolicyViewSet)
router.register(r'checkout', CheckoutViewSet, basename='checkout')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/', include('users.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/filters/', FilterOptionsView.as_view(), name='filters'),
    path('__debug__/', include(debug_toolbar.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)