// src/components/Header.tsx
import "./Header.css";
import logo from "../../assets/logo.svg";
import cart from "../../assets/Cart.png";
import search from "../../assets/search.png";
import userProfile from "../../assets/userProfile.png";
export default function  Header  ()  {
    return(
  <header className="header">
  <div className="headerCenter">
    <img className="logo" src={logo} alt="Logo" />

    <div className="navWrapper">
      <nav>
        <a className="navLink" href="">Каталог</a>
        <a className="navLink" href="">Новости</a>
        <a className="navLink" href="">Галерея</a>
        <a className="navLink" href="">О нас</a>
      </nav>
    </div>

    <div className="navButtons">
      <button><img src={search} alt="Search" /></button>
      <button><img src={userProfile} alt="User" /></button>
      <button><img src={cart} alt="Cart" /></button>
    </div>
  </div>
</header>
    )
};

