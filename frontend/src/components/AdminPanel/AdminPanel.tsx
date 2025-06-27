import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPanel.css'; 
import SneakerForm from './SneakerForm';
import OrderStatusForm from './OrderStatusForm';
import UserRoleForm from './UserRoleForm';
// Интерфейсы данных
interface Brand {
  id: number;
  name: string;
}

interface Sneaker {
  id: number;
  name: string;
  brand?: Brand;
  price: number;
}

interface Order {
  id: number;
  full_name: string;
  status: string;
  total_price: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  is_superuser: boolean;
}

// Для profile API
interface Profile {
  is_superuser: boolean;
}
const statusLabels: Record<string, string> = {
  pending: 'Ожидание',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};
const AdminPanel: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [sneakers, setSneakers] = useState<Sneaker[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [showSneakerForm, setShowSneakerForm] = useState(false);
  const [editingSneaker, setEditingSneaker] = useState<Sneaker | null>(null);

  const [showOrderStatusForm, setShowOrderStatusForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [showUserRoleForm, setShowUserRoleForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);


  // Проверка токена и роли
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setToken(t);

    axios.get<Profile>('http://localhost:8000/api/profile/', {
      headers: { Authorization: `Token ${t}` }
    })
      .then(res => {
        if (res.data.is_superuser) {
          setIsAdmin(true);
          loadData(t);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      })
      .catch(() => {
        setIsAdmin(false);
        setLoading(false);
      });
  }, []);

  // Загрузка данных
  const loadData = (token: string) => {
  setLoading(true);
  Promise.all([
    axios.get<Sneaker[]>('http://localhost:8000/api/sneakers/', { headers: { Authorization: `Token ${token}` } }),
    axios.get<Order[]>('http://localhost:8000/api/orders/', { headers: { Authorization: `Token ${token}` } }),
    axios.get<User[]>('http://localhost:8000/api/users/', { headers: { Authorization: `Token ${token}` } }),
  ])
    .then(([sneakersRes, ordersRes, usersRes]) => {
      // Если структура аналогична orders, то здесь тоже нужно:
      setSneakers(sneakersRes.data.sneakers || sneakersRes.data); // или sneakersRes.data.results
      console.log('Sneakers response:', sneakersRes.data);
      setOrders(ordersRes.data.orders || ordersRes.data); // точно ordersRes.data.orders
      setUsers(usersRes.data.users || usersRes.data);
    })
    .catch(() => setError('Ошибка загрузки данных'))
    .finally(() => setLoading(false));
};


  // Удаление кроссовка
  const deleteSneaker = (id: number) => {
    if (!window.confirm('Удалить этот кроссовок?')) return;
    if (!token) return;

    axios.delete(`http://localhost:8000/api/sneakers/${id}/`, {
      headers: { Authorization: `Token ${token}` }
    }).then(() => {
      setSneakers(sneakers.filter(s => s.id !== id));
    }).catch(() => alert('Ошибка удаления'));
  };

  if (loading) return <p>Загрузка...</p>;
  if (!isAdmin) return <p>Доступ запрещён. Вы не администратор.</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
    const reloadData = () => {
    if (token) loadData(token);
  };

  return (
    <div className="admin-panel">
  <h1 className="admin-title">Админ панель</h1>
<section className="admin-section">
  <h2 className="admin-subtitle">Управление кроссовками</h2>
  <button
    className="admin-button"
    onClick={() => {
      setEditingSneaker(null);
      setShowSneakerForm(true);
    }}
  >
    Добавить кроссовок
  </button>


<ul className="admin-list">
  {sneakers.map(s => (
    <li key={s.id} className="admin-item column-layout">
      <div className="admin-item-info">
        <div><strong>Название:</strong> {s.name}</div>
        <div><strong>Бренд:</strong> {s.brand?.name || 'Без бренда'}</div>
        <div><strong>Цена:</strong> {s.price}₽</div>
      </div>
      <button
        className="admin-button"
        onClick={() => {
          setEditingSneaker(s);
          setShowSneakerForm(true);
        }}
      >
        Редактировать
      </button>
      {/* Удаление убрано */}
    </li>
  ))}
</ul>

</section>

 <section className="admin-section">
  <h2 className="admin-subtitle">Управление заказами</h2>
  <ul className="admin-list">
    {orders.map(o => (
      <li key={o.id} className="admin-item">
        <div className="admin-item-info">
          <div><strong>Заказ:</strong> #{o.id}</div>
          <div><strong>Клиент:</strong> {o.full_name}</div>
          <div><strong>Статус:</strong> {statusLabels[o.status] || o.status}</div>
          <div><strong>Сумма:</strong> {o.total_price}₽</div>
        </div>
        <button
          className="admin-button"
          onClick={() => {
            setEditingOrder(o);
            setShowOrderStatusForm(true);
          }}
        >
          Изменить статус
        </button>
      </li>
    ))}
  </ul>
</section>

  <section className="admin-section">
    <h2 className="admin-subtitle">Управление пользователями</h2>
   <ul className="admin-list">
  {orders.map(o => (
    <li key={o.id} className="admin-item column-layout">
      <div className="admin-item-info">
        <div><strong>Заказ:</strong> #{o.id}</div>
        <div><strong>Клиент:</strong> {o.full_name}</div>
        <div><strong>Статус:</strong> {o.status}</div>
        <div><strong>Сумма:</strong> {o.total_price}₽</div>
      </div>
      <button
        className="admin-button"
        onClick={() => {
          setEditingOrder(o);
          setShowOrderStatusForm(true);
        }}
      >
        Изменить статус
      </button>
    </li>
  ))}
</ul>

  </section>

  {showSneakerForm && (
    <SneakerForm
      token={token!}
      sneaker={editingSneaker || undefined}
      onClose={() => setShowSneakerForm(false)}
      onSave={reloadData}
    />
  )}

  {showOrderStatusForm && editingOrder && (
    <OrderStatusForm
      token={token!}
      orderId={editingOrder.id}
      currentStatus={editingOrder.status}
      onClose={() => setShowOrderStatusForm(false)}
      onSave={reloadData}
    />
  )}

  {showUserRoleForm && editingUser && (
    <UserRoleForm
      token={token!}
      userId={editingUser.id}
      currentRole={editingUser.is_superuser}
      onClose={() => setShowUserRoleForm(false)}
      onSave={reloadData}
    />
  )}
</div>

  );
};

export default AdminPanel;