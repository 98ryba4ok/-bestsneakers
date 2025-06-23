import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { Review } from '../../types/review';
import './RecentReviews.css';

const RecentReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  const fetchRecentReviews = async () => {
    try {
      const res = await axios.get<Review[]>('http://127.0.0.1:8000/api/reviews/');
      const sorted = res.data
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
      setReviews(sorted);
    } catch (error) {
      console.error('Ошибка при загрузке последних отзывов:', error);
    }
  };

  const fetchAverageRating = async () => {
    try {
      const res = await axios.get<{ average_rating: number | null }>(
        'http://127.0.0.1:8000/api/reviews/average_rating/'
      );
      setAverageRating(res.data.average_rating);
    } catch (error) {
      console.error('Ошибка при загрузке среднего рейтинга:', error);
    }
  };

  useEffect(() => {
    fetchRecentReviews();
    fetchAverageRating();
  }, []);

  return (
    <div className="recent-reviews">
      <h2>Отзывы на наши товары</h2>

      {averageRating !== null && (
        <div className="average-rating">
          Средняя оценка: <span>{averageRating.toFixed(2)}★</span> 
        </div>
      )}

      {reviews.length === 0 ? (
        <p>Отзывы не найдены</p>
      ) : (
        <div className="recent-reviews-wrapper">
          {reviews.map((r) => (
            <div key={r.id} className="recent-review-item">
              <p className="recent-review-username">{r.user.username}</p>
              <div className="recent-review-rating">{'★'.repeat(r.rating)}</div>
              <div className="recent-review-text">
                {r.text.length > 100 ? r.text.slice(0, 100) + '...' : r.text}
              </div>
              <div className="recent-review-date">
                {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentReviews;
