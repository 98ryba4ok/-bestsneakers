from django.db.models import QuerySet
from django_filters import rest_framework as filters
from django_filters.rest_framework.backends import DjangoFilterBackend
from .models import Sneaker


class SneakerFilter(filters.FilterSet):
    """
    Фильтрация кроссовок по различным параметрам.

    Позволяет фильтровать кроссовки по цене, бренду, полу, категории, цвету и размеру.
    """

    price_min: filters.NumberFilter = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max: filters.NumberFilter = filters.NumberFilter(field_name="price", lookup_expr="lte")
    brand: filters.CharFilter = filters.CharFilter(field_name="brand__name", lookup_expr="iexact")
    gender: filters.ChoiceFilter = filters.ChoiceFilter(field_name="gender", choices=Sneaker.GENDER_CHOICES)
    category: filters.CharFilter = filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    color: filters.CharFilter = filters.CharFilter(field_name="color", lookup_expr="iexact")
    size: filters.NumberFilter = filters.NumberFilter(method="filter_by_size")

    def filter_by_size(self, queryset: QuerySet, name: str, value: int) -> QuerySet:
        """
        Фильтрация по размеру кроссовок.

        Args:
            queryset (QuerySet): Исходный набор данных.
            name (str): Название фильтра.
            value (int): Значение размера.

        Returns:
            QuerySet: Отфильтрованные кроссовки по указанному размеру.
        """
        return queryset.filter(stock__size__size=value).distinct()

    class Meta:
        model = Sneaker
        fields: list[str] = [
            'price_min', 'price_max', 'brand',
            'gender', 'category', 'color', 'size'
        ]
