import React, { useState } from 'react';
import axios from 'axios';
import './UserRoleForm.css'; // стили модалки

interface UserRoleFormProps {
  token: string;
  userId: number;
  currentRole: boolean;
  currentStatus: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UserRoleForm: React.FC<UserRoleFormProps> = ({
  token, userId, currentRole, currentStatus, onClose, onSave
}) => {
  const [isAdmin, setIsAdmin] = useState(currentRole);
  const [isActive, setIsActive] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    axios.patch(`http://localhost:8000/api/users/${userId}/`, {
      is_superuser: isAdmin,
      is_active: isActive,
    }, {
      headers: { Authorization: `Token ${token}` }
    }).then(() => {
      onSave();
      onClose();
    }).catch(() => setError('Ошибка при обновлении пользователя'));
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3 className="modal-title">Редактировать пользователя #{userId}</h3>
        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={handleSubmit} className="modal-form">
          <label className="modal-label">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={e => setIsAdmin(e.target.checked)}
            />
            Администратор
          </label>

          <label className="modal-label">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
            />
            Активен
          </label>

          <div className="modal-actions">
            <button type="submit" className="modal-button modal-save">Сохранить</button>
            <button type="button" className="modal-button modal-cancel" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRoleForm;
