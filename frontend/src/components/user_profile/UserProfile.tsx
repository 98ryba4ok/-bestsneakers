import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css";

export default function UserProfile() {
  const [user, setUser] = useState<{
    username: string;
    email?: string;
    phone?: string;
    address?: string;
    first_name?: string;
    last_name?: string;
    is_superuser?: boolean;
  } | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    first_name: "",
    last_name: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:8000/api/profile/", {
        headers: { Authorization: `Token ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Ошибка загрузки профиля");
          return res.json();
        })
        .then((data) => {
          setUser(data);
          setFormData({
            username: data.username || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            first_name: data.first_name || "",
            last_name: data.last_name || "",
          });
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
      }).then(() => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
      });
    }
  };

  const handleEdit = () => setEditMode(true);

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
        .then((res) => {
          if (!res.ok) throw new Error("Ошибка сохранения");
          return res.json();
        })
        .then((data) => {
          setUser(data);
          setEditMode(false);
        });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!user) {
    return <p>Пожалуйста, авторизуйтесь</p>;
  }

  return (
    <div className="user-profile">
      <h1 className="user-profile__title">Личный кабинет</h1>

      {editMode ? (
        <>
          {[
            { label: "Имя пользователя", name: "username" },
            { label: "Email", name: "email" },
            { label: "Телефон", name: "phone" },
            { label: "Адрес", name: "address" },
            { label: "Имя", name: "first_name" },
            { label: "Фамилия", name: "last_name" },
          ].map(({ label, name }) => (
            <div className="user-profile__field" key={name}>
              <label className="user-profile__label">{label}:</label>
              <input
                name={name}
                value={formData[name as keyof typeof formData]}
                onChange={handleChange}
                className="user-profile__input"
              />
            </div>
          ))}

          <button className="user-profile__button" onClick={handleSave}>
            Сохранить
          </button>
        </>
      ) : (
        <>
          <p className="user-profile__text">
            <strong>Имя пользователя:</strong> {user.username}
          </p>
          <p className="user-profile__text">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="user-profile__text">
            <strong>Телефон:</strong> {user.phone}
          </p>
          <p className="user-profile__text">
            <strong>Адрес:</strong> {user.address}
          </p>
          <p className="user-profile__text">
            <strong>Имя:</strong> {user.first_name}
          </p>
          <p className="user-profile__text">
            <strong>Фамилия:</strong> {user.last_name}
          </p>

          <button className="user-profile__button" onClick={handleEdit}>
            Редактировать
          </button>
        </>
      )}

      <br />

      <button className="user-profile__button" onClick={handleLogout}>
        Выйти
      </button>

      <button
        onClick={handleDelete}
        className="user-profile__button user-profile__button--delete"
      >
        Удалить аккаунт
      </button>

      {user.is_superuser && (
        <button
          className="user-profile__button"
          onClick={() => navigate("/admin")}
        >
          Админ панель
        </button>
      )}

      <button
        className="user-profile__button"
        onClick={() => navigate("/orders")}
      >
        Мои заказы
      </button>
    </div>
  );
}
