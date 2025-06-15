import "./SneakersCard.css";
import { useNavigate } from "react-router-dom";
import type { Sneaker } from '../../types/Sneaker';

interface Props {
  sneaker: Sneaker;
}
export default function SneakersCard({ sneaker }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/sneakers/${sneaker.id}`);
  };

  const mainImage = sneaker.images.find(img => img.is_main)?.image 
                  || sneaker.images[0]?.image 
                  || ''; // fallback

  return (
    <div className="Sneakers_card" >
      <img src={mainImage} alt={sneaker.name} className="Sneakers_image" />
      <div className="Sneakers_text">
        <h3>{sneaker.name}</h3>
        <h4>{parseFloat(sneaker.price).toLocaleString('ru-RU')} ₽</h4>
      </div>
      <button
        className="Sneakers_button"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        Купить
      </button>
    </div>
  );
}
