import type { Size } from "./Size";
export interface Cart {
  id: number;
  sneaker: number;  //ID of the sneaker
  size: Size;
  quantity: number;
  user: number; // ID of the user
}