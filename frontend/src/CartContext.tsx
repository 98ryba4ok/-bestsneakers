// CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { getCart } from "./utils/cart";

const CartContext = createContext<{ cartCount: number; updateCount: () => void }>({
  cartCount: 0,
  updateCount: () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);

  const updateCount = () => {
    const cart = getCart();
    setCartCount(cart.length);
  };

  useEffect(() => {
    updateCount();
    window.addEventListener("cartUpdated", updateCount);
    return () => window.removeEventListener("cartUpdated", updateCount);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, updateCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
