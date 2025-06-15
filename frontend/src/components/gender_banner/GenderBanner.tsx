import "./GenderBanner.css";
type GenderBannerProps = {
  image: string;
  buttonText: string;
  link: string;
};
export default function GenderBanner({ image, buttonText, link }: GenderBannerProps) {
  return (
  <div className="gender-banner" style={{ backgroundImage: `url(${image})` }}>
  
    <a href={link} className="gender-banner__button">
      {buttonText}
    </a>

</div>

  );
}
