import React, { useState } from 'react';
import axios from 'axios';
import './ReviewForm.css';

interface ReviewFormProps {
  sneakerId: number;
  userId: number;
  onReviewAdded: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ sneakerId,  onReviewAdded }) => {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem('token');
    await axios.post('http://127.0.0.1:8000/api/reviews/', {
      rating,
      text,
      sneaker: sneakerId,
    }, {
      headers: {
        Authorization: `Token ${token}`,
      }
    });
    setText('');
    setRating(5);
    onReviewAdded();
  } catch (error) {
    console.error('Ошибка при отправке отзыва:', error);
  }
};


  return (
    <form onSubmit={handleSubmit} className="review-form">
      <textarea
        placeholder="Ваш отзыв..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
      >
        {[5, 4, 3, 2, 1].map((r) => (
          <option key={r} value={r}>
            {r} ★
          </option>
        ))}
      </select>
      <button type="submit">Отправить отзыв</button>
    </form>
  );
};

export default ReviewForm;
