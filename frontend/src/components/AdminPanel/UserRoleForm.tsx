// UserRoleForm.tsx
import React, { useState } from 'react';
import axios from 'axios';

interface UserRoleFormProps {
  token: string;
  userId: number;
  currentRole: boolean; // is_superuser
  onClose: () => void;
  onSave: () => void;
}

const UserRoleForm: React.FC<UserRoleFormProps> = ({ token, userId, currentRole, onClose, onSave }) => {
  const [isAdmin, setIsAdmin] = useState(currentRole);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    axios.patch(`http://localhost:8000/api/users/${userId}/`, { is_superuser: isAdmin }, {
      headers: { Authorization: `Token ${token}` }
    }).then(() => {
      onSave();
      onClose();
    }).catch(() => setError('Ошибка изменения роли'));
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <h3>Изменить роль пользователя #{userId}</h3>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <label>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={e => setIsAdmin(e.target.checked)}
          />
          Администратор
        </label>
        <button type="submit">Сохранить</button>
        <button type="button" onClick={onClose}>Отмена</button>
      </form>
    </div>
  );
};

export default UserRoleForm;
