import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../store";
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  selectCartItems,
} from "../../store/cartSlice";
import { fetchUserProfile } from "../../store/userSlice";
import type { Sneaker } from "../../types/Sneaker";
import './CartPage.css';
import trashIcon from "../../assets/trash-bin.png";

export default function CartPage() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector(selectCartItems);
  const [sneakersData, setSneakersData] = useState<Record<number, Sneaker>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(fetchUserProfile(token));
    }
    dispatch(fetchCart());
  }, [dispatch]);

  // Логируем cartItems только при их изменении
  useEffect(() => {

  }, [cartItems]);

  // Отдельный useEffect для уникальных sneakerIds с логом
  useEffect(() => {
    const uniqueIds = [...new Set(
  cartItems
    .map(item => item.sneakerId)
    .filter((id): id is number => id !== undefined)
)];



    if (uniqueIds.length === 0) {
      setSneakersData({});
      return;
    }

    Promise.all(
      uniqueIds.map(id =>
        fetch(`http://localhost:8000/api/sneakers/${id}/`)
          .then(res => {
            if (!res.ok) throw new Error(`Sneaker ${id} not found`);
            return res.json();
          })
      )
    )
      .then(sneakers => {
        console.log("sneakers fetched:", sneakers);
        const data: Record<number, Sneaker> = {};
        sneakers.forEach(sneaker => {
          console.log(`Sneaker ${sneaker.id} images:`, sneaker.images);
          data[sneaker.id] = sneaker;
        });
        setSneakersData(data);
      })
      .catch(err => {
        console.error("Ошибка при загрузке кроссовок:", err);
      });
  }, [cartItems]);

  const updateQuantity = (index: number, delta: number) => {
    const item = cartItems[index];
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    dispatch(updateCartItem({ ...item, quantity: newQty }));
  };

  const removeItem = (index: number) => {
    const item = cartItems[index];
    dispatch(removeCartItem(item));
  };

  const handleClick = (id: number) => {
    navigate(`/sneakers/${id}`);
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const sneaker = sneakersData[item.sneakerId];
    return sneaker ? sum + parseFloat(sneaker.price) * item.quantity : sum;
  }, 0);

  return (
    <div className="cart-page">
      <h1>Корзина</h1>
      {cartItems.length === 0 ? (
        <p>Корзина пуста.</p>
      ) : (
        <>
          {cartItems.map((item, index) => {
            const sneaker = sneakersData[item.sneakerId];
            if (!sneaker || !Array.isArray(sneaker.images) || sneaker.images.length === 0) {
              return <div key={`${item.sneakerId}-${item.sizeId}`}>Данные о кроссовке загружаются...</div>;
            }

            const mainImage = sneaker.images.find(img => img.is_main)?.image || "";

            return (
              <div
                key={`${item.sneakerId}-${item.sizeId}`}
                className="cart-item"
                onClick={() => handleClick(sneaker.id)}
              >
                <img src={mainImage} alt={sneaker.name} className="cart-image" />
                <div className="cart-info name">{sneaker.name}</div>
                <div className="cart-info size">{item.sizeId} EU</div>
                <div className="cart-info quantity">
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(index, -1); }}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(index, 1); }}>+</button>
                </div>
                <div className="cart-info price">{(parseFloat(sneaker.price) * item.quantity).toFixed(2)} ₽</div>
                <div className="cart-info remove">
                  <button onClick={(e) => { e.stopPropagation(); removeItem(index); }}>
                    <img src={trashIcon} alt="Удалить" />
                  </button>
                </div>
              </div>
            );
          })}
          <div className="cart-footer">
            <div className="cart-total">Итого: {totalPrice.toFixed(2)} ₽</div>
            <button className="checkout-button" onClick={() => navigate('/checkout')}>
              Оформить заказ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
