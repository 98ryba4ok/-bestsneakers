import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const [user, setUser] = useState<{ username: string; email?: string } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "" });
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:8000/api/profile/", {
        headers: { Authorization: `Token ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setFormData({ username: data.username, email: data.email || "" });
        })
        .catch(() => setUser(null));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  const handleDelete = () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:8000/api/profile/", {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      })
        .then(() => {
          localStorage.removeItem("token");
          setUser(null);
          navigate("/");
        });
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:8000/api/profile/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(formData),
      })
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setEditMode(false);
        });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!user) {
    return <p>Пожалуйста, авторизуйтесь</p>; // можно вставить  AuthModal
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Личный кабинет</h1>

      {editMode ? (
        <>
          <div>
            <label>Имя пользователя:</label>
            <input name="username" value={formData.username} onChange={handleChange} />
          </div>
          <div>
            <label>Email:</label>
            <input name="email" value={formData.email} onChange={handleChange} />
          </div>
          <button onClick={handleSave}>Сохранить</button>
        </>
      ) : (
        <>
          <p><strong>Имя пользователя:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <button onClick={handleEdit}>Редактировать</button>
        </>
      )}

      <br />
      <button onClick={handleLogout}>Выйти</button>
      <button onClick={handleDelete} style={{ color: "red", marginLeft: "10px" }}>
        Удалить аккаунт
      </button>
    </div>
  );
}
