// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter } from "react-router-dom";
import AppWithLoader from './AppWithLoader';
import { CartProvider } from './CartContext'; // путь подкорректируй под твою структуру

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <AppWithLoader />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
);
