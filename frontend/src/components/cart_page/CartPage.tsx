import { useEffect, useState } from "react";
import { getCart, saveCart } from "../../utils/cart";
import axios from "axios";
import type { Sneaker } from "../../types/Sneaker.ts";
import './CartPage.css';
import trashIcon from '../../assets/trash-bin.png';
import { useNavigate } from "react-router-dom";

type CartItem = {
  id: number;
  sneaker: number;
  size: {
    id: number;
    size: number;
  };
  quantity: number;
};


export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sneakersData, setSneakersData] = useState<Record<number, Sneaker>>({});

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // Загрузить профиль и корзину с сервера
      axios.get("http://localhost:8000/api/profile/", {
        headers: { Authorization: `Token ${token}` }
      }).then(() => {

        // Теперь загрузить корзину
        return axios.get("http://localhost:8000/api/cart/", {
          headers: { Authorization: `Token ${token}` }
        });
      })
      .then(res => {
        setCartItems(res.data); // Предполагаем, что сервер отдаёт массив CartItem
      })
      .catch(() => {
       
        // fallback — локалка
        const cart = getCart();
        setCartItems(cart);
      });
    } else {
      // Гость — локалка
      const cart = getCart();
      setCartItems(cart);
    }
  }, []);

  useEffect(() => {
    // Подгрузить данные кроссовок
    const uniqueIds = [...new Set(cartItems.map(item => item.sneaker))];

    Promise.all(
      uniqueIds.map(id =>
        fetch(`http://localhost:8000/api/sneakers/${id}/`).then(res => res.json())
      )
    ).then(sneakers => {
      const data: Record<number, Sneaker> = {};
      sneakers.forEach(sneaker => {
        data[sneaker.id] = sneaker;
      });
      setSneakersData(data);
    });
  }, [cartItems]);

  const handleClick = (id: number) => {
    navigate(`/sneakers/${id}`);
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cartItems];
    const newQty = updated[index].quantity + delta;
    if (newQty < 1) return;

    updated[index].quantity = newQty;

    const token = localStorage.getItem("token");
    if (token) {
      // Обновляем на сервере
      const item = updated[index];
axios.patch(`http://localhost:8000/api/cart/${item.id}/`, { quantity: item.quantity }, {
  headers: { Authorization: `Token ${token}` }
})

      .then(() => {
        setCartItems(updated);
        window.dispatchEvent(new Event("cartUpdated"));
      })
      .catch(err => console.error("Ошибка обновления количества:", err));
    } else {
      // Локалка
      setCartItems(updated);
      saveCart(updated);
    }
  };

  const removeItem = (index: number) => {
    const updated = [...cartItems];
    const removedItem = updated.splice(index, 1)[0];

    const token = localStorage.getItem("token");
    if (token) {
      axios.delete(`http://localhost:8000/api/cart/${removedItem.id}/`, {
  headers: { Authorization: `Token ${token}` }
})

      .then(() => {
        setCartItems(updated);
        window.dispatchEvent(new Event("cartUpdated"));
      })
      .catch(err => console.error("Ошибка удаления товара из корзины:", err));
    } else {
      setCartItems(updated);
      saveCart(updated);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const sneaker = sneakersData[item.sneaker];
    return sneaker ? sum + sneaker.price * item.quantity : sum;
  }, 0);

  return (
    <div className="cart-page">
      <h1>Корзина</h1>
      {cartItems.length === 0 ? (
        <p>Корзина пуста.</p>
      ) : (
        <>
          {cartItems.map((item, index) => {
            console.log("item.size:", item.size);

            const sneaker = sneakersData[item.sneaker];
            if (!sneaker) return null;

            const mainImage = sneaker.images.find(img => img.is_main)?.image || "";

            return (
              <div key={index} className="cart-item" onClick={() => handleClick(sneaker.id)}>
                <img src={mainImage} alt={sneaker.name} className="cart-image" />
                <div className="cart-info name">{sneaker.name}</div>
                <div className="cart-info size">{item.size.size} EU</div>
                <div className="cart-info quantity">
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(index, -1); }}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(index, 1); }}>+</button>
                </div>
                <div className="cart-info price">{sneaker.price * item.quantity} ₽</div>
                <div className="cart-info remove">
                  <button onClick={(e) => { e.stopPropagation(); removeItem(index); }}>
                    <img src={trashIcon} alt="Удалить" />
                  </button>
                </div>
              </div>
            );
          })}
          <div className="cart-footer">
            <div className="cart-total">Итого: {totalPrice} ₽</div>
            <button className="checkout-button" onClick={() => navigate('/checkout')}>
  Оформить заказ
</button>
          </div>
        </>
      )}
    </div>
  );
}
