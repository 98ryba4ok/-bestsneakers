import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SneakerForm.css';

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface SneakerFormProps {
  token: string;
  sneaker?: {
    id?: number;
    name: string;
    price: number;
    description?: string;
    brand?: Brand;
    category?: Category;
  };
  onClose: () => void;
  onSave: () => void;
}

const SneakerForm: React.FC<SneakerFormProps> = ({ token, sneaker, onClose, onSave }) => {
  const [name, setName] = useState(sneaker?.name || '');
  const [price, setPrice] = useState(sneaker?.price || 0);
  const [description, setDescription] = useState(sneaker?.description || '');
  const [brandId, setBrandId] = useState<number | undefined>(sneaker?.brand?.id);
  const [categoryId, setCategoryId] = useState<number | undefined>(sneaker?.category?.id);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          axios.get<Brand[]>('http://localhost:8000/api/brands/', {
            headers: { Authorization: `Token ${token}` }
          }),
          axios.get<Category[]>('http://localhost:8000/api/categories/', {
            headers: { Authorization: `Token ${token}` }
          })
        ]);
        setBrands(brandsRes.data);
        setCategories(categoriesRes.data);
      } catch {
        setError('Ошибка загрузки данных');
      }
    };

    fetchLists();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = {
  name,
  price,
  description,
  brand_id: brandId ?? null,
  category_id: categoryId ?? null,
};



    try {
      if (sneaker?.id) {
        await axios.put(
          `http://localhost:8000/api/sneakers/${sneaker.id}/`,
          data,
          { headers: { Authorization: `Token ${token}` } }
        );
      } else {
        await axios.post(
          'http://localhost:8000/api/sneakers/',
          data,
          { headers: { Authorization: `Token ${token}` } }
        );
      }
      onSave();
      onClose();
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sneaker?.id) return;
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;

    setError(null);
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/sneakers/${sneaker.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      onSave();
      onClose();
    } catch {
      setError('Ошибка удаления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal_overlay">
      <form className="modal_content" onSubmit={handleSubmit}>
        <h2>{sneaker ? 'Редактировать кроссовок' : 'Добавить кроссовок'}</h2>
        {error && <p className="error_message">{error}</p>}

        <input
          type="text"
          placeholder="Название"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="number"
          placeholder="Цена"
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
          min={0}
          required
          disabled={loading}
        />
        <textarea
          placeholder="Описание"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={loading}
        />
        <select
          value={brandId ?? ''}
          onChange={e => setBrandId(e.target.value ? Number(e.target.value) : undefined)}
          disabled={loading}
        >
          <option value="">Без бренда</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={categoryId ?? ''}
          onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          disabled={loading}
        >
          <option value="">Без категории</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="modal_buttons">
          <button type="submit" disabled={loading}>Сохранить</button>
          {sneaker?.id && (
            <button
              type="button"
              className="danger"
              onClick={handleDelete}
              disabled={loading}
            >
              Удалить
            </button>
          )}
          <button type="button" onClick={onClose} disabled={loading}>Отмена</button>
        </div>
      </form>
    </div>
  );
};

export default SneakerForm;
