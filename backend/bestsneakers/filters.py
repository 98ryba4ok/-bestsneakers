# filters.py
from django_filters import rest_framework as filters
from .models import Sneaker

class SneakerFilter(filters.FilterSet):
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    brand = filters.CharFilter(field_name="brand__name", lookup_expr="iexact")  # исправлено
    gender = filters.ChoiceFilter(field_name="gender", choices=Sneaker.GENDER_CHOICES)

    category = filters.CharFilter(field_name="category__slug", lookup_expr="iexact")  # ОК, если фронт передаёт slug
    color = filters.CharFilter(field_name="color", lookup_expr="iexact")  # исправлено
    size = filters.NumberFilter(method="filter_by_size")

    def filter_by_size(self, queryset, name, value):
        return queryset.filter(stock__size__size=value).distinct()

    class Meta:
        model = Sneaker
        fields = ['price_min', 'price_max', 'brand', 'gender', 'category', 'color', 'size']
