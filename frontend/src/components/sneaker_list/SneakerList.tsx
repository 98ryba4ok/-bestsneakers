// src/components/SneakerList.jsx
import  { useEffect, useState } from 'react';
import axios from 'axios';
import SneakersCard from '../sneakers_card/SneakersCard';
import './SneakerList.css'; // по желанию
import type { Sneaker } from '../../types/Sneaker';
export default function SneakerList() {
  const [sneakers, setSneakers] = useState<Sneaker[]>([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/sneakers/')
      .then(response => setSneakers(response.data))
      .catch(error => console.error('Ошибка при получении кроссовок:', error));
  }, []);

  return (
    <div>
      <h2>Новая коллекция</h2>
    <div className="Sneakers_grid">
      {sneakers.map(sneaker => (
        <SneakersCard key={sneaker.id} sneaker={sneaker} />
      ))}
    </div>
    </div>
  );
}
