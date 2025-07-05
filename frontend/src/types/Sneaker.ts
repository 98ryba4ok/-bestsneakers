import  type { Brand } from './Brand';
import type { Category } from './Category';
import type { Size } from './Size';
export interface SneakerImage {
  id: number;
  image: string;
  is_main: boolean;
}


export interface Sneaker {
  id: number;
  avg_rating: number | null;
  name: string;
  price:  string;
  description: string;
  gender: 'F' | 'M' | 'U';
  color: string;
  brand: Brand;
  sold_count: number | null;
  category: Category;
  sizes: Size[];
  images: SneakerImage[]; 
}
