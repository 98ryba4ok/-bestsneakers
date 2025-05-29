import "./GenderBanner.css";

export default function GenderBanner({ image, buttonText, link }) {
  return (
  <div className="gender-banner" style={{ backgroundImage: `url(${image})` }}>
  
    <a href={link} className="gender-banner__button">
      {buttonText}
    </a>

</div>

  );
}
