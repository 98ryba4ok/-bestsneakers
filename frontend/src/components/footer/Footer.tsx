import "./Footer.css";

export default function Footer  ({  ...props })  {
  return (
    <div className={"footer " }>
      <img className="logofixed-1" src="logofixed-10.png" />
      <div className="_2018-2024-bestsnickers">2018-2024 Ⓒ BESTSNICKERS </div>
      <div className="div">
        <div className="mingcute-telegram-fill">
          <img className="group" src="group0.svg" />
        </div>
        <img className="akar-icons-vk-fill" src="akar-icons-vk-fill0.svg" />
        <img className="mdi-pinterest" src="mdi-pinterest0.svg" />
      </div>
      <div className="div2">
        <div className="div3">
          <div className="div4">Поддержка </div>
          <div className="_79999999999">+79999999999 </div>
          <div className="snickers-mail-com">snickers@mail.com </div>
        </div>
        <div className="div5">
          <div className="div6">Сервис </div>
          <div className="div7">Консультации </div>
          <div className="div7">Правила сервиса </div>
        </div>
        <div className="div8">
          <div className="div6">О нас </div>
          <div className="div7">Блог </div>
          <div className="div7">Галерея </div>
        </div>
      </div>
      <div className="div9">
        <div className="faq">FAQ </div>
        <div className="div7">Доставка </div>
        <div className="div7">Оплата </div>
      </div>
    </div>
  );
};
