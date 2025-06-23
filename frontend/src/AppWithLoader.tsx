// AppWithLoader.tsx
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate} from "react-router-dom";
import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import GenderGroup from './components/gender_group/GenderGroup';
import SneakerList from './components/sneaker_list/SneakerList';
import MainBanner from './components/main_banner/MainBanner';
import UserProfile from './components/user_profile/UserProfile';
import SneakerPage from './components/sneaker_page/SneakerPage';
import Loader from './components/loader/Loader';
import CartPage from './components/cart_page/CartPage';
import SneakersCatalog from './components/sneakers_сatalog/SneakersCatalog';
import './AppWithLoader.css';
import UserOrders from './components/order_page/UserOrders';
import CheckoutPage from './components/checkout_page/CheckoutPage';
import RecentReviews from './components/reviews/RecentReviews';
import TestButton from './components/testtoast';
import AdminPanel from './components/AdminPanel/AdminPanel';
export default function AppWithLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1100); // задержка для плавности
    return () => clearTimeout(timer);
  }, [location.pathname]);

return (
  <div className="app-wrapper">
    {loading && <Loader />}
    <Header />
    <main className="main-content">
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
              <TestButton/>
              <MainBanner />
              <GenderGroup />
              <SneakerList />
              <RecentReviews />
              <SneakersCatalog />
            </div>
          }
        />
        <Route path="/admin" element={<AdminPanel/>} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/sneakers/:id" element={<SneakerPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<UserOrders />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/catalog" element={<SneakersCatalog />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <Footer />
  </div>
);
}
