import React, { useState } from 'react';
import axios from 'axios';
import './OrderStatusForm.css'; // подключаем стили

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

const statusLabels: Record<string, string> = {
  pending: 'Ожидание',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

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

  const handleCancelOrder = () => {
    setError(null);
    axios.patch(`http://localhost:8000/api/orders/${orderId}/`, { status: 'cancelled' }, {
      headers: { Authorization: `Token ${token}` }
    }).then(() => {
      onSave();
      onClose();
    }).catch(() => setError('Ошибка при отмене заказа'));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit} className="status-form">
          <h3 className="form-title">Изменить статус заказа #{orderId}</h3>
          {error && <p className="error-text">{error}</p>}

          <select value={status} onChange={e => setStatus(e.target.value)} className="status-select" required>
  {statuses.map(s => (
    <option key={s} value={s}>{statusLabels[s]}</option>
  ))}
</select>


          <div className="button-group">
            <button type="submit" className="btn btn-primary">Сохранить</button>
            <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
          </div>
        </form>

        {!['shipped', 'delivered', 'cancelled'].includes(currentStatus) && (
          <button
            type="button"
            onClick={handleCancelOrder}
            className="btn btn-danger cancel-order-btn"
          >
            Отменить заказ
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderStatusForm;
