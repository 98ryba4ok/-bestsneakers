// Loader.tsx
import './Loader.css';
import logo from '../../assets/logo.svg';
export default function Loader() {
  return (
    <div className="loader-fullscreen">
      <img src={logo} alt="" className="brand-loader" />
    </div>
  );
}
