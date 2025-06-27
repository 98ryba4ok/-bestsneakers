import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SneakerEditModal.css';

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Props {
  sneakerId: number;
  initialName: string;
  initialPrice: number;
  initialDescription: string;
  initialBrandId: number;
  initialCategoryId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export default function SneakerEditModal({
  sneakerId,
  initialName,
  initialPrice,
  initialDescription,
  initialBrandId,
  initialCategoryId,
  onClose,
  onUpdate
}: Props) {
  const [name, setName] = useState(initialName);
  const [price, setPrice] = useState(initialPrice);
  const [description, setDescription] = useState(initialDescription);
  const [brandId, setBrandId] = useState(initialBrandId);
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/brands/')
      .then(res => setBrands(res.data))
      .catch(err => console.error("Ошибка загрузки брендов:", err));

    axios.get('http://localhost:8000/api/categories/')
      .then(res => setCategories(res.data))
      .catch(err => console.error("Ошибка загрузки категорий:", err));
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Токен не найден, нужно авторизоваться.");
      return;
    }

    // Проверка обязательных полей
    if (!name || !price || !brandId || !categoryId) {
      console.error("Пожалуйста, заполните все поля.");
      return;
    }

    try {
      
      await axios.put(
        `http://localhost:8000/api/sneakers/${sneakerId}/`,
        {
          name,
          price,
          description,
          brand_id: brandId.id,
          category_id: categoryId.id 
       
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Ошибка при обновлении товара:', error.response?.data || error);
    }
  };

  const handleDelete = () => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Вы уверены, что хотите удалить этот товар?")) return;

    axios.delete(`http://localhost:8000/api/sneakers/${sneakerId}/`, {
      headers: { Authorization: `Token ${token}` }
    })
    .then(() => {
      onClose();
      window.location.href = '/';
    })
    .catch(err => console.error("Ошибка при удалении товара:", err.response?.data || err));
  };

  return (
    <div className="modal_overlay">
      <div className="modal_content">
        <h2>Редактировать товар</h2>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Название"
        />
        <input
          type="number"
          value={price}
          onChange={e => setPrice(parseFloat(e.target.value))}
          placeholder="Цена"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Описание"
        />
        <select
          value={brandId}
          onChange={e => setBrandId(parseInt(e.target.value))}
        >
          <option disabled value="">Выберите бренд</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={e => setCategoryId(parseInt(e.target.value))}
        >
          <option disabled value="">Выберите категорию</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <div className="modal_buttons">
          <button onClick={handleSave}>Сохранить</button>
          <button onClick={handleDelete} className="danger">Удалить</button>
          <button onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}
