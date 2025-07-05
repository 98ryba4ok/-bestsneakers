export interface CartItem {
  id?: number; // только если получено с сервера
  sneakerId: number;
  sizeId: number;
  quantity: number;
}
