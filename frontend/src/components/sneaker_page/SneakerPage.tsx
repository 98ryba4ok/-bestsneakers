import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './SneakerPage.css';
import type { Sneaker, SneakerImage } from '../../types/Sneaker';
import { addToCart } from '../../utils/cart';
import arrow_left from '../../assets/arrow_left.svg';
import arrow_right from '../../assets/arrow_right.svg';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewList from '../../components/reviews/ReviewList';
function formatSize(size: number): string {
  return Number.isInteger(size) ? String(size) : size.toFixed(1);
}






export default function SneakerPage() {
  const { id } = useParams();
  const [sneaker, setSneaker] = useState<Sneaker | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

  const [userId, setUserId] = useState<number | null>(null);
useEffect(() => {
  const token = localStorage.getItem("token");

  if (token) {
    axios.get("http://localhost:8000/api/profile/", {
      headers: { Authorization: `Token ${token}` }
    })
      .then(res => setUserId(res.data.id)) // предполагаем, что backend возвращает `id`
      .catch(() => setUserId(null));
  }
}, []);

useEffect(() => {
  axios.get(`http://127.0.0.1:8000/api/sneakers/${id}/`)
    .then(response => {
      const data = response.data;

      // Приводим size к числу
      const sizesWithNumber = data.sizes.map((sizeObj: any) => ({
        ...sizeObj,
        size: parseFloat(sizeObj.size)
      }));

      // Приводим изображение к текущему формату
      const mainImg = data.images.find((img: SneakerImage) => img.is_main);
      setSneaker({
        ...data,
        sizes: sizesWithNumber
      });

      setCurrentImage(mainImg ? mainImg.image : (data.images[0]?.image || null));
    })
    .catch(error => console.error('Ошибка при получении товара:', error));
}, [id]);

const handleAddToCart = () => {
  if (!selectedSizeId || !sneaker) return;

  const item = {
    sneaker: sneaker.id,
    size: selectedSizeId,
    quantity: 1
  };

  const token = localStorage.getItem("token");

  if (token) {
    // Работаем только с сервером, не трогаем локалку
    axios.post("http://localhost:8000/api/cart/", item, {
      headers: { Authorization: `Token ${token}` }
    })
    .then(response => {
      // Можно обновить состояние корзины через глобальный event или Context API
      window.dispatchEvent(new Event("cartUpdated"));
    })
    .catch(err => {
      console.error("Ошибка при добавлении в корзину:", err.response?.data || err);
    });
  } else {
    // Неавторизованный — только локалка
    addToCart(item);
  }
};

const handleNextImage = () => {
  if (!sneaker || sneaker.images.length === 0 || !currentImage) return;

  const currentIndex = sneaker.images.findIndex(img => img.image === currentImage);
  const nextIndex = (currentIndex + 1) % sneaker.images.length;
  setCurrentImage(sneaker.images[nextIndex].image);
};

const handlePrevImage = () => {
  if (!sneaker || sneaker.images.length === 0 || !currentImage) return;

  const currentIndex = sneaker.images.findIndex(img => img.image === currentImage);
  const prevIndex = (currentIndex - 1 + sneaker.images.length) % sneaker.images.length;
  setCurrentImage(sneaker.images[prevIndex].image);
};

  if (!sneaker) return <p>Загрузка...</p>;

  return (
    <div className="SneakerPage">
    <div className='Main_container'>
      <div className="SneakerPage_slider">
  <div className="SneakerPage_thumbnails-vertical">
    {sneaker.images.slice(0, 3).map(img => (
      <img
        key={img.id}
        src={img.image}
        alt={`${sneaker.name} thumbnail`}
        className={`SneakerPage_thumbnail ${currentImage === img.image ? 'active' : ''}`}
        onClick={() => setCurrentImage(img.image)}
      />
    ))}
  </div>

  <div className="SneakerPage_mainImageWrapper">
  <img
    src={currentImage!}
    alt={sneaker.name}
    className="SneakerPage_image"
  />
  <div className="SneakerPage_arrow_wrapper left">
  <img src={arrow_left} alt="" className="SneakerPage_arrow" onClick={handlePrevImage} />
</div>
<div className="SneakerPage_arrow_wrapper right">
  <img src={arrow_right} alt="" className="SneakerPage_arrow" onClick={handleNextImage} />
</div>

</div>

</div>

      <div className="SneakerPage_info">
        <h2>{sneaker.name}</h2>
       
        <p className="SneakerPage_price">{(sneaker.price).toLocaleString('ru-RU')} ₽</p>

        <div className="SneakerPage_sizes">
          <p>Размеры</p>
          <div className='sneaker-sizes'>
 {sneaker.sizes.map(sizeObj => (
  <button
    key={sizeObj.id}
    className={`size-button ${selectedSizeId === sizeObj.id ? 'selected' : ''}`}
    onClick={() => setSelectedSizeId(sizeObj.id)}
  >
    {`${formatSize(sizeObj.size)} EU`}
  </button>
))}
  </div>
        </div>

      <button
  className="SneakerPage_button"
  disabled={!selectedSizeId}
  onClick={handleAddToCart}
>
  Добавить в корзину
</button>
      </div>
      </div>
      <h3 className='description_header'>Описание</h3>
 <p className='descripton_text'>{sneaker.description}</p>
    <h3 className="description_header">Отзывы</h3>

{userId && (
  <ReviewForm
    sneakerId={sneaker.id}
    userId={userId}
    onReviewAdded={() => {}} // позже добавим refresh, если нужно
  />
)}

<ReviewList sneakerId={sneaker.id} />
    </div>
  );
}
