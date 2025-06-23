import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import logo from "../../assets/logo.svg";
import cart from "../../assets/Cart.png";
import search from "../../assets/search.png";
import userProfile from "../../assets/userProfile.png";
import AuthModal from "../register_form/AuthModal";
import { useCart } from "../../CartContext";
import SearchBox from "../search_box/SearchBox";

export default function Header() {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:8000/api/profile/", {
        headers: { Authorization: `Token ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch(() => setUser(null));
    }
  }, []);

  const { cartCount } = useCart();

  const handleUserClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      setShowAuth(true);
    }
  };

  const toggleSearch = () => setShowSearch((prev) => !prev);

  const toggleBurger = () => setBurgerOpen((prev) => !prev);

  // Закрыть меню при клике по ссылке
  const onNavClick = () => setBurgerOpen(false);

  return (
    <>
      <header className="header">
        <div className="headerCenter">
          <Link to="/" className="logoLink">
            <img className="logo" src={logo} alt="Logo" />
          </Link>

          {/* Навигация - большая версия */}
          <nav className={`navWrapper ${burgerOpen ? "open" : ""}`}>
            <Link className="navLink" to="/catalog" onClick={onNavClick}>
              Каталог
            </Link>
            <Link className="navLink" to="/news" onClick={onNavClick}>
              Новости
            </Link>
            <Link className="navLink" to="/gallery" onClick={onNavClick}>
              Галерея
            </Link>
            <Link className="navLink" to="/about" onClick={onNavClick}>
              О нас
            </Link>
          </nav>

          {/* Кнопки справа */}
          <div className="navButtons">
            <button onClick={toggleSearch} aria-label="Поиск">
              <img src={search} alt="" />
            </button>
            <button onClick={handleUserClick} aria-label="Профиль">
              <img src={userProfile} alt="" />
            </button>
            <button
              className="cart-button"
              onClick={() => navigate("/cart")}
              aria-label="Корзина"
            >
              <img src={cart} alt="" />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>

            {/* Бургер кнопка для мобильных */}
            <button
              className={`burger-button ${burgerOpen ? "open" : ""}`}
              onClick={toggleBurger}
              aria-label="Меню"
            >
              <span />
             
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Мобильное меню - выдвижное */}
        <div className={`mobileMenuOverlay ${burgerOpen ? "open" : ""}`}>
          <nav className="mobileNav">
            <Link to="/catalog" onClick={onNavClick}>
              Каталог
            </Link>
            <Link to="/news" onClick={onNavClick}>
              Новости
            </Link>
            <Link to="/gallery" onClick={onNavClick}>
              Галерея
            </Link>
            <Link to="/about" onClick={onNavClick}>
              О нас
            </Link>
          </nav>
        </div>

        {showSearch && (
          <div className="search-box-wrapper">
            <SearchBox onClose={() => setShowSearch(false)} />
          </div>
        )}
      </header>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLoginSuccess={(user) => setUser(user)}
        />
      )}
    </>
  );
}
