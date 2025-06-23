import { useEffect, useState } from "react";
import React from "react";
import SneakersCard from "../sneakers_card/SneakersCard";
import "./SneakersCatalog.css";
import type { Sneaker } from "../../types/Sneaker";

interface FilterData {
  brands: string[];
  categories: string[];
  colors: string[];
  genders: { value: string; label: string }[];
  sizes: string[];
}

export default function SneakersCatalog() {
  const [sneakers, setSneakers] = useState<Sneaker[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterData | null>(null);
  const [filters, setFilters] = useState({
    price_min: "",
    price_max: "",
    brand: "",
    gender: "",
    category: "",
    color: "",
    size: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Получаем список фильтров
  useEffect(() => {
    fetch("http://localhost:8000/api/filters/")
      .then((res) => res.json())
      .then((data: FilterData) => setFilterOptions(data))
      .catch((err) => console.error("Ошибка загрузки фильтров", err));
  }, []);

  // Получаем список кроссовок по фильтрам
  useEffect(() => {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    fetch(`http://localhost:8000/api/sneakers/?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => setSneakers(data));
  }, [filters]);

  return (
    <div className="Sneakers_catalog">
      <h1>Каталог кроссовок</h1>

      <div className="filters">
        <input
          type="number"
          placeholder="Цена от"
          name="price_min"
          value={filters.price_min}
          onChange={handleChange}
        />
        <input
          type="number"
          placeholder="Цена до"
          name="price_max"
          value={filters.price_max}
          onChange={handleChange}
        />

        <select name="brand" value={filters.brand} onChange={handleChange}>
          <option value="">Бренд</option>
          {filterOptions?.brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select name="gender" value={filters.gender} onChange={handleChange}>
          <option value="">Пол</option>
          {filterOptions?.genders.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>

        <select name="category" value={filters.category} onChange={handleChange}>
          <option value="">Категория</option>
          {filterOptions?.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select name="color" value={filters.color} onChange={handleChange}>
  <option value="">Цвет</option>
  {[...new Set(filterOptions?.colors)].map((color) => (
    <option key={color} value={color}>
      {color}
    </option>
  ))}
</select>


        <select name="size" value={filters.size} onChange={handleChange}>
          <option value="">Размер</option>
          {filterOptions?.sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="Sneakers_list">
        {sneakers.map((s) => (
          <SneakersCard key={s.id} sneaker={s} />
        ))}
      </div>
    </div>
  );
}
