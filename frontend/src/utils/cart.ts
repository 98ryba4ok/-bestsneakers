import type { CartItem } from "../store/cartSlice";
export function getCart(): CartItem[] {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) as CartItem[] : [];
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  cart.push(item);
  saveCart(cart);
  window.dispatchEvent(new Event("cartUpdated"));
}
