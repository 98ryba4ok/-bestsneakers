// SneakerForm.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Brand {
  id: number;
  name: string;
}

interface SneakerFormProps {
  token: string;
  sneaker?: {
    id?: number;
    name: string;
    brand?: Brand;
    price: number;
  };
  onClose: () => void;
  onSave: () => void;
}

const SneakerForm: React.FC<SneakerFormProps> = ({ token, sneaker, onClose, onSave }) => {
  const [name, setName] = useState(sneaker?.name || '');
  const [price, setPrice] = useState(sneaker?.price || 0);
  const [brandId, setBrandId] = useState<number | undefined>(sneaker?.brand?.id);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get<Brand[]>('http://localhost:8000/api/brands/', {
      headers: { Authorization: `Token ${token}` }
    }).then(res => setBrands(res.data))
      .catch(() => setError('Ошибка загрузки брендов'));
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data = {
      name,
      price,
      brand: brandId,
    };

    const url = sneaker?.id
      ? `http://localhost:8000/api/sneakers/${sneaker.id}/`
      : 'http://localhost:8000/api/sneakers/';
    const method = sneaker?.id ? 'put' : 'post';

    axios({
      method,
      url,
      data,
      headers: { Authorization: `Token ${token}` }
    }).then(() => {
      onSave();
      onClose();
    }).catch(() => setError('Ошибка сохранения'));
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <h3>{sneaker ? 'Редактировать кроссовок' : 'Добавить кроссовок'}</h3>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input
          type="text"
          placeholder="Название"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Цена"
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
          min={0}
          required
        />
        <select
          value={brandId || ''}
          onChange={e => setBrandId(Number(e.target.value) || undefined)}
        >
          <option value="">Без бренда</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <button type="submit">Сохранить</button>
        <button type="button" onClick={onClose}>Отмена</button>
      </form>
    </div>
  );
};

export default SneakerForm;
