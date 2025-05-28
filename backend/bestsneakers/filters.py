# sneakers/filters.py (или filters.py рядом с views.py)
import django_filters
from .models import Sneaker

class SneakerFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte', label='Цена от')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte', label='Цена до')
    brand = django_filters.NumberFilter(field_name='brand__id', label='Бренд (id)')
    color = django_filters.CharFilter(field_name='color', lookup_expr='icontains', label='Цвет')
    size = django_filters.NumberFilter(method='filter_by_size', label='Размер')

    class Meta:
        model = Sneaker
        fields = ['brand', 'color']

    def filter_by_size(self, queryset, name, value):
        return queryset.filter(sizes__size=value)
