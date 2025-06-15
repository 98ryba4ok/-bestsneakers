export interface SneakerImage {
  id: number;
  image: string;
  is_main: boolean;
}
export interface SneakerSize {
  id: number;
  size: number;
}

export interface Sneaker {
  id: number;
  avg_rating: number | null;
  name: string;
  price:  number;
  description: string;
  gender: string;
  color: string;
  created_at: string;
  updated_at: string;
  brand: number;
  category: number;
  sizes: SneakerSize[];
  images: SneakerImage[]; // 👈 новое поле вместо image
}
