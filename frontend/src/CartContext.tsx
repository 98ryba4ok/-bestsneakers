import { createContext, useContext, useEffect, useState } from "react";
import React from "react";
import axios from "axios";
import { getCart } from "./utils/cart";

const CartContext = createContext<{ cartCount: number }>({ cartCount: 0 });

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.get("http://localhost:8000/api/cart/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then(res => {
        const total = res.data.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(total);
      })
      .catch(() => setCartCount(0));
    } else {
      const cart = getCart();
      const total = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    }
  };

  useEffect(() => {
    updateCartCount();

    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  return (
    <CartContext.Provider value={{ cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
