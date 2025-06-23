import { useEffect, useState } from 'react';
import axios from 'axios';
import SneakersCard from '../sneakers_card/SneakersCard';
import './SneakerList.css';
import type { Sneaker } from '../../types/Sneaker';

export default function SneakerList() {
  const [sneakers, setSneakers] = useState<Sneaker[]>([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/sneakers/')
      .then(response => setSneakers(response.data))
      .catch(error => console.error('Ошибка при получении кроссовок:', error));
  }, []);

  return (
   <div className="sneaker-slider-wrapper">
  <h2 className='otstup'>Новая коллекция</h2>
  <div className="sneaker-slider">
    <div className="sneaker-slide spacer" /> {/* Пустой слайд для отступа */}
    {sneakers.map(sneaker => (
      <div className="sneaker-slide" key={sneaker.id}>
        <SneakersCard sneaker={sneaker} />
      </div>
    ))}
  </div>
</div>


  );
}
