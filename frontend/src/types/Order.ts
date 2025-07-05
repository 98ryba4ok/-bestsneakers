import type { Sneaker } from './Sneaker';
export interface Orders  {
  total_revenue?: number;
  orders: Order[];
};

export interface Order  {
  id: number;
  items: OrderItem[];
  total_price: string;
  created_at: string;
  full_name: string;
  phone: string;
  address: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string; // если есть фиксированный набор — лучше заменить
  user: number;
  sneakers: number[];
};

type OrderItem = {
  id: number;
  sneaker: Sneaker;
  size: string;
  quantity: number;
  price: string;
};







