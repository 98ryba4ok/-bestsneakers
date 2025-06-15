// utils/cart.ts
export function getCart(): any[] {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

export function saveCart(cart: any[]) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function addToCart(item: any) {
  const cart = getCart();
  cart.push(item);
  saveCart(cart);
  window.dispatchEvent(new Event("cartUpdated"));

}
