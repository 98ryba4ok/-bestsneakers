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
import SneakerEditModal from '../../components/sneaker_edit_modal/SneakerEditModal';
import { useToast } from '../../components/toast/ToastProvider';

function formatSize(size: number): string {
  return Number.isInteger(size) ? String(size) : size.toFixed(1);
}

export default function SneakerPage() {
  const { id } = useParams<{ id: string }>();
  const sneakerId = Number(id);
  const { showToast } = useToast();

  const [sneaker, setSneaker] = useState<Sneaker | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
useEffect(() => {
  window.scrollTo(0, 0);
}, []);
  // Получаем профиль пользователя, чтобы понять, кто он и админ ли
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUserId(null);
      setIsAdmin(false);
      return;
    }
    axios.get('http://localhost:8000/api/profile/', {
      headers: { Authorization: `Token ${token}` }
    })
      .then(res => {
        setUserId(res.data.id);
        setIsAdmin(res.data.is_superuser);
      })
      .catch(() => {
        setUserId(null);
        setIsAdmin(false);
      });
  }, []);

  // Загружаем данные кроссовка
  useEffect(() => {
    if (!sneakerId) return;

    axios.get(`http://127.0.0.1:8000/api/sneakers/${sneakerId}/`)
      .then(response => {
        const data = response.data;

        // Парсим размеры в числа
        const sizesWithNumber = data.sizes.map((sizeObj: any) => ({
          ...sizeObj,
          size: parseFloat(sizeObj.size)
        }));

        // Находим главное изображение
        const mainImg = data.images.find((img: SneakerImage) => img.is_main);

        setSneaker({ ...data, sizes: sizesWithNumber });
        setCurrentImage(mainImg ? mainImg.image : data.images[0]?.image || null);
        setSelectedSizeId(null); // сбрасываем выбор размера при новой загрузке
      })
      .catch(err => console.error('Ошибка при получении товара:', err));
  }, [sneakerId]);

  // Добавление в корзину
  const handleAddToCart = () => {
    if (!selectedSizeId || !sneaker) return;

    const item = {
      sneaker: sneaker.id,
      size_id: selectedSizeId,
      quantity: 1,
    };

    const token = localStorage.getItem('token');

    if (token) {
      axios.post('http://localhost:8000/api/cart/', item, {
        headers: { Authorization: `Token ${token}` }
      })
        .then(() => {
          window.dispatchEvent(new Event('cartUpdated'));
        })
        .catch(err => {
  

  const data = err.response?.data;

  const message =
    Array.isArray(data) ? data[0] :
    data?.detail ||
    (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null) ||
    (typeof data === 'string' ? data : null) ||
    "Ошибка при добавлении в корзину";

  showToast(message, "error");
});




    } else {
      addToCart(item);
    }
  };

  // Переключение изображений
  const handleNextImage = () => {
    if (!sneaker || !currentImage) return;

    const currentIndex = sneaker.images.findIndex(img => img.image === currentImage);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % sneaker.images.length;
    setCurrentImage(sneaker.images[nextIndex].image);
  };

  const handlePrevImage = () => {
    if (!sneaker || !currentImage) return;

    const currentIndex = sneaker.images.findIndex(img => img.image === currentImage);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + sneaker.images.length) % sneaker.images.length;
    setCurrentImage(sneaker.images[prevIndex].image);
  };

  if (!sneaker) return <p>Загрузка...</p>;

  return (
    <div className="SneakerPage">
      <div className="Main_container">
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
              <img src={arrow_left} alt="Previous" className="SneakerPage_arrow" onClick={handlePrevImage} />
            </div>
            <div className="SneakerPage_arrow_wrapper right">
              <img src={arrow_right} alt="Next" className="SneakerPage_arrow" onClick={handleNextImage} />
            </div>
          </div>
        </div>

        <div className="SneakerPage_info">
          <h2>{sneaker.name}</h2>
          <p className="SneakerPage_price">{sneaker.price.toLocaleString('ru-RU')} ₽</p>

          <div className="SneakerPage_sizes">
            <p>Размеры</p>
            <div className="sneaker-sizes">
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

          {isAdmin && (
            <button className="SneakerPage_adminButton" onClick={() => setIsEditModalOpen(true)}>
              Редактировать
            </button>
          )}
        </div>
      </div>

      <h3 className="description_header">Описание</h3>
      <p className="descripton_text">{sneaker.description}</p>

      <h3 className="description_header">Отзывы</h3>
      {userId && (
        <ReviewForm
          sneakerId={sneaker.id}
          userId={userId}
          onReviewAdded={() => { /* можно добавить обновление отзывов */ }}
        />
      )}
      <ReviewList sneakerId={sneaker.id} />

      {isEditModalOpen && (
        <SneakerEditModal
          sneakerId={sneaker.id}
          initialName={sneaker.name}
          initialPrice={sneaker.price}
          initialDescription={sneaker.description}
          initialBrandId={sneaker.brand}    
          initialCategoryId={sneaker.category} 
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={() => {
            // Перезагрузка данных после редактирования
            axios.get(`http://127.0.0.1:8000/api/sneakers/${sneakerId}/`)
              .then(response => {
                const data = response.data;
                const sizesWithNumber = data.sizes.map((sizeObj: any) => ({
                  ...sizeObj,
                  size: parseFloat(sizeObj.size),
                }));
                const mainImg = data.images.find((img: SneakerImage) => img.is_main);
                setSneaker({ ...data, sizes: sizesWithNumber });
                setCurrentImage(mainImg ? mainImg.image : (data.images[0]?.image || null));
              })
              .catch(err => console.error('Ошибка при обновлении товара:', err));
          }}
        />
      )}
    </div>
  );
}
