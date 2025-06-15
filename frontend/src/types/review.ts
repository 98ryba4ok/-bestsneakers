export interface Review {
  id: number;
  rating: number;
  text: string;
  created_at: string;
  user: {
    id: number;
    username: string;
  };
  sneaker: number;
}