import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { Review } from '../../types/review';
import './ReviewList.css';

interface ReviewListProps {
  sneakerId: number;
}

const ReviewList: React.FC<ReviewListProps> = ({ sneakerId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get<Review[]>('http://127.0.0.1:8000/api/reviews/');
      const filtered = res.data.filter((r) => r.sneaker === sneakerId);
      setReviews(filtered);
    } catch (error) {
      console.error('Ошибка при загрузке отзывов:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [sneakerId]);

  return (
    <div className="review-container">
      {reviews.length === 0 ? (
        <p>Пока нет отзывов</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="review-item">
            <p className="review-username">{r.user.username}</p>
            <div className="review-rating">{'★'.repeat(r.rating)}</div>
            <div className="review-text">{r.text}</div>
            <div className="review-date">
              {new Date(r.created_at).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ReviewList;
