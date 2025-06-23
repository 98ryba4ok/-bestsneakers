import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    paymentMethod: "card",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Автозаполнение из профиля
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("http://localhost:8000/api/profile/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => {
        const data = res.data;
        setForm((prev) => ({
          ...prev,
          fullName: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          phone: data.phone || "",
          address: data.address || "",
        }));
      })
      .catch((err) => {
        console.error("Не удалось получить профиль:", err);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!form.fullName || !form.phone || !form.address) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await axios.post(
        "http://localhost:8000/api/checkout/",
        {
          full_name: form.fullName,
          phone: form.phone,
          address: form.address,
          payment_method: form.paymentMethod,
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );

      setSuccess(true);
      window.dispatchEvent(new Event("cartUpdated"));
      setTimeout(() => navigate("/orders"), 2000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Ошибка при оформлении заказа"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Оформление заказа</h1>

      {error && <p className="checkout-error">{error}</p>}

      {success ? (
        <p className="checkout-success">Заказ успешно оформлен! Перенаправляем...</p>
      ) : (
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-field">
            <label>ФИО</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Иван Иванов"
              required
            />
          </div>

          <div className="checkout-field">
            <label>Телефон</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+7 900 123 45 67"
              required
            />
          </div>

          <div className="checkout-field">
            <label>Адрес доставки</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="г. Москва, ул. Примерная, д. 10"
              required
            />
          </div>

          <div className="checkout-field">
            <label>Способ оплаты</label>
            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={form.paymentMethod === "card"}
                  onChange={handleChange}
                />
                Картой онлайн
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={form.paymentMethod === "paypal"}
                  onChange={handleChange}
                />
                PayPal
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="crypto"
                  checked={form.paymentMethod === "crypto"}
                  onChange={handleChange}
                />
                Криптовалюта
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="checkout-button"
          >
            {loading ? "Оформляем..." : "Подтвердить заказ"}
          </button>
        </form>
      )}
    </div>
  );
}
