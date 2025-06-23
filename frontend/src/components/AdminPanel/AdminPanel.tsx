import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
    <div style={{ padding: 20 }}>
      <h1>Админ панель</h1>

      <section>
        <h2>Управление кроссовками</h2>
        <button onClick={() => { setEditingSneaker(null); setShowSneakerForm(true); }}>
          Добавить кроссовок
        </button>
        <ul>
          {sneakers.map(s => (
            <li key={s.id}>
              {s.name} — {s.brand?.name || 'Без бренда'} — {s.price}₽ 
              <button onClick={() => { setEditingSneaker(s); setShowSneakerForm(true); }}>Редактировать</button>
              <button onClick={() => deleteSneaker(s.id)} style={{color: 'red'}}>Удалить</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Управление заказами</h2>
        <ul>
          {orders.map(o => (
            <li key={o.id}>
              Заказ #{o.id} от {o.full_name} — Статус: {o.status} — Сумма: {o.total_price}₽
              <button onClick={() => { setEditingOrder(o); setShowOrderStatusForm(true); }}>Изменить статус</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Управление пользователями</h2>
        <ul>
          {users.map(u => (
            <li key={u.id}>
              {u.email} — {u.is_superuser ? 'Админ' : 'Пользователь'} — {u.is_active ? 'Активен' : 'Заблокирован'}
              <button onClick={() => { setEditingUser(u); setShowUserRoleForm(true); }}>Изменить роль</button>
              {/* Можно добавить кнопку блокировки/разблокировки */}
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