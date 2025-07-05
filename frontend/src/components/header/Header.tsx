import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Header.css";
import logo from "../../assets/logo.svg";
import cart from "../../assets/Cart.png";
import search from "../../assets/search.png";
import userProfile from "../../assets/userProfile.png";
import AuthModal from "../register_form/AuthModal";
import SearchBox from "../search_box/SearchBox";
import { fetchUserProfile, selectUser, } from "../../store/userSlice";
import { selectCartCount, fetchCart  } from "../../store/cartSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks"; 

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const cartCount = useAppSelector(selectCartCount);

  const [showAuth, setShowAuth] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);
  useEffect(() => {
  dispatch(fetchCart());
}, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      dispatch(fetchUserProfile(token));
    }
  }, [dispatch, user]);

  const handleUserClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      setShowAuth(true);
    }
  };

  const toggleSearch = () => setShowSearch((prev) => !prev);
  const toggleBurger = () => setBurgerOpen((prev) => !prev);
  const onNavClick = () => setBurgerOpen(false);


  return (
    <>
      <header className="header">
        <div className="headerCenter">
          <Link to="/" className="logoLink">
            <img className="logo" src={logo} alt="Logo" />
          </Link>

          <nav className={`navWrapper ${burgerOpen ? "open" : ""}`}>
            <Link className="navLink" to="/catalog" onClick={onNavClick}>Каталог</Link>
            <Link className="navLink" to="/news" onClick={onNavClick}>Новости</Link>
            <Link className="navLink" to="/gallery" onClick={onNavClick}>Галерея</Link>
            <Link className="navLink" to="/about" onClick={onNavClick}>О нас</Link>
          </nav>

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

        <div className={`mobileMenuOverlay ${burgerOpen ? "open" : ""}`}>
          <nav className="mobileNav">
            <Link to="/catalog" onClick={onNavClick}>Каталог</Link>
            <Link to="/news" onClick={onNavClick}>Новости</Link>
            <Link to="/gallery" onClick={onNavClick}>Галерея</Link>
            <Link to="/about" onClick={onNavClick}>О нас</Link>
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
          onLoginSuccess={(userData) => {
            dispatch({ type: 'user/setUser', payload: userData });
            setShowAuth(false);
          }}
        />
      )}
    </>
  );
}
