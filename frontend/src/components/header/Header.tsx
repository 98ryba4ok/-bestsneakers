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
// ...остальной импорт

export default function Header() {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [showSearch, setShowSearch] = useState(false); // ← добавили

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

  return (
    <>
      <header className="header">
        <div className="headerCenter">
          <Link to="/">
            <img className="logo" src={logo} alt="Logo" />
          </Link>

          <nav className="navWrapper">
            <Link className="navLink" to="/catalog">Каталог</Link>
            <Link className="navLink" to="/news">Новости</Link>
            <Link className="navLink" to="/gallery">Галерея</Link>
            <Link className="navLink" to="/about">О нас</Link>
          </nav>

          {user && (
            <div className="userInfo">
              <p>Привет, {user.username}!</p>
            </div>
          )}

          <div className="navButtons">
            <button onClick={toggleSearch}>
              <img src={search} alt="Поиск" />
            </button>
            <button onClick={handleUserClick}>
              <img src={userProfile} alt="Профиль" />
            </button>
            <button className="cart-button" onClick={() => navigate("/cart")}>
              <img src={cart} alt="Корзина" />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
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
