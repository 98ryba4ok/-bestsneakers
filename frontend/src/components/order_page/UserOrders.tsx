import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserOrders.css";

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:8000/api/orders/", {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || data);
        if (data.total_revenue) setTotalRevenue(data.total_revenue);
      });
  }, [navigate]);
console.log(orders);
  return (
    <div className="user-orders">
      <h1>Мои заказы</h1>

 
{orders.length === 0 ? (
  <p>У вас пока нет заказов.</p>
) : (
  <div className="orders-list">
    {orders.map((order: any) => (
      <div className="order-card" key={order.id}>
        <h3>Заказ #{order.id}</h3>
        <p><strong>Дата:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
        <p><strong>Сумма:</strong> {order.total_price} ₽</p>
        <p><strong>Статус:</strong> {order.status}</p>
        <p><strong>Товаров:</strong> {order.items.length}</p>

        <ul className="order-items-list">
          {order.items.map((item: any) => {
            const mainImage = item.sneaker?.images?.find((img: any) => img.is_main) || item.sneaker?.images?.[0];
            const imageUrl = mainImage ? mainImage.image : "/placeholder.jpg";

            return (
              <li key={item.id} className="order-item">
                <div className="order-item__left">
                  <img
                    src={imageUrl}
                    alt={item.sneaker?.name || "Кроссовки"}
                    className="order-item__image"
                  />
                </div>
                <div className="order-item__right">
                  <p className="order-item__name">{item.sneaker?.name || "Без названия"}</p>
                  <p className="order-item__details">
                    Размер: <strong>{item.size}</strong> &nbsp;|&nbsp;
                    Кол-во: <strong>{item.quantity}</strong> &nbsp;|&nbsp;
                    Цена: <strong>{item.price} ₽</strong>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </div>
)}


      {totalRevenue > 0 && (
        <p className="revenue">Общая выручка: {totalRevenue} ₽</p>
      )}
    </div>
  );
}
