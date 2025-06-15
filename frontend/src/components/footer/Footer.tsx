import React, { useEffect, useState } from "react";
import "./Footer.css";
import logo from "../../assets/logo.svg";
import vkLogo from "../../assets/vk_logo.svg";
import tgLogo from "../../assets/tg_logo.svg";
import pinterestLogo from "../../assets/pinterest_logo.svg";

export default function Footer() {
  const [policyUrl, setPolicyUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/policies/?is_active=true")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPolicyUrl(data[0].file);
        }
      });
  }, []);

  return (
    <footer className="footer">
      <div className="flex_photo">
        <div className="footer__sections">
          <div className="footer__column">
            <h4 className="footer__title">Поддержка</h4>
            <a href="tel:+79999999999">+7 999 999 99 99</a>
            <a href="mailto:snickers@mail.com">snickers@mail.com</a>
          </div>
          <div className="footer__column">
            <h4 className="footer__title">Сервис</h4>
            <a href="#">Консультации</a>
            {policyUrl ? (
              <a href={policyUrl} download>
                Правила сервиса
              </a>
            ) : (
              <span>Правила сервиса</span>
            )}
          </div>
          <div className="footer__column">
            <h4 className="footer__title">О нас</h4>
            <a href="#">Блог</a>
            <a href="#">Галерея</a>
          </div>
          <div className="footer__column">
            <h4 className="footer__title">FAQ</h4>
            <a href="#">Доставка</a>
            <a href="#">Оплата</a>
          </div>
        </div>

        <div className="footer__top">
          <img className="footer__logo" src={logo} alt="BESTSNICKERS logo" />
          <div className="footer__socials">
            <a href="#"><img src={tgLogo} alt="Telegram" /></a>
            <a href="#"><img src={vkLogo} alt="VK" /></a>
            <a href="#"><img src={pinterestLogo} alt="Pinterest" /></a>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <p>2018–2024 Ⓒ BESTSNICKERS</p>
      </div>
    </footer>
  );
}
