import React, { useState, useEffect, useRef } from "react";
import "./AuthModal.css";

interface Props {
  onClose: () => void;
  onLoginSuccess: (user: { username: string }) => void;
}

export default function AuthModal({ onClose, onLoginSuccess }: Props) {
  const [isLogin, setIsLogin] = useState<boolean | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = isLogin
      ? "http://localhost:8000/api/login/"
      : "http://localhost:8000/api/register/";

    const body = isLogin
      ? { username, password }
      : { username, password, email, phone, first_name: firstName, last_name: lastName };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.token);
      onLoginSuccess({ username });
      handleClose();
    } else {
      alert("Ошибка: " + response.status);
    }
  };

  const handleClose = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
    onClose();
  };

  return (
    <dialog className="authModal" ref={dialogRef} onCancel={handleClose}>
      <button className="closeBtn" onClick={handleClose}>×</button>

      {isLogin === null ? (
        <div className="tabs">
          <button onClick={() => setIsLogin(true)}>Войти</button>
          <button onClick={() => setIsLogin(false)}>Регистрация</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2>{isLogin ? "Вход" : "Регистрация"}</h2>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {!isLogin && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Телефон"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                type="text"
                placeholder="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </>
          )}
          <button className= "enter_button" type="submit">{isLogin ? "Войти" : "Зарегистрироваться"}</button>
        </form>
      )}
    </dialog>
  );
}
