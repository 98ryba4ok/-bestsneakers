// OrderStatusForm.tsx
import React, { useState } from 'react';
import axios from 'axios';

interface OrderStatusFormProps {
  token: string;
  orderId: number;
  currentStatus: string;
  onClose: () => void;
  onSave: () => void;
}

const OrderStatusForm: React.FC<OrderStatusFormProps> = ({ token, orderId, currentStatus, onClose, onSave }) => {
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    axios.patch(`http://localhost:8000/api/orders/${orderId}/`, { status }, {
      headers: { Authorization: `Token ${token}` }
    }).then(() => {
      onSave();
      onClose();
    }).catch(() => setError('Ошибка изменения статуса'));
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <h3>Изменить статус заказа #{orderId}</h3>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <select value={status} onChange={e => setStatus(e.target.value)} required>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit">Сохранить</button>
        <button type="button" onClick={onClose}>Отмена</button>
      </form>
    </div>
  );
};

export default OrderStatusForm;
