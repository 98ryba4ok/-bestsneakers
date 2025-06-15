import { useEffect, useState } from 'react';
import "./MainBanner.css";

// Определяем тип баннера
type Banner = {
  id: number;
  image: string;
  title: string;
  link: string;
  is_active: boolean;
};

const MainBanner = () => {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/banners/')
      .then((res) => res.json())
      .then((data: Banner[]) => {
        const activeBanners = data.filter(banner => banner.is_active);
        setBanners(activeBanners);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке баннеров:', error);
      });
  }, []);

  if (!banners.length) return null;

  return (
    <div className="main_image">
      {banners.map((banner) => (
        <a key={banner.id} href={banner.link} target="_blank" rel="noopener noreferrer">
          <img
            src={banner.image}
            alt={banner.title}
            className="main_image_img"
          />
        </a>
      ))}
    </div>
  );
};

export default MainBanner;
