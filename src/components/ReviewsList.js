import React, { useState, useEffect } from 'react';
import  api  from '../services/api';
import './ReviewsList.css';

const ReviewsList = ({ masterId, compact = false }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = compact ? 3 : 10;

  useEffect(() => {
    loadReviews();
  }, [masterId, offset]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reviews?master_id=${masterId}&limit=${limit}&offset=${offset}`);
      const data = response.data;
      if (data.success) {
        if (offset === 0) {
          setReviews(data.reviews);
        } else {
          setReviews(prev => [...prev, ...data.reviews]);
        }
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setOffset(prev => prev + limit);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading && reviews.length === 0) {
    return <div className="reviews-loading">Загрузка отзывов...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-empty">
        <p>Пока нет отзывов</p>
        <p className="hint">Будьте первым, кто оставит отзыв!</p>
      </div>
    );
  }

  return (
    <div className="reviews-list">
      <div className="reviews-header">
        <h3>Отзывы клиентов</h3>
        <span className="reviews-count">{total} {getDeclension(total, 'отзыв', 'отзыва', 'отзывов')}</span>
      </div>
      
      {reviews.map(review => (
        <div key={review.id} className="review-card">
          <div className="review-header">
            <div className="reviewer-info">
              <div className="reviewer-avatar">
                {review.avatar_url ? (
                  <img src={review.avatar_url} alt={review.first_name} />
                ) : (
                  <div className="avatar-placeholder">
                    {review.first_name?.[0]}{review.last_name?.[0]}
                  </div>
                )}
              </div>
              <div className="reviewer-details">
                <div className="reviewer-name">
                  {review.first_name} {review.last_name}
                </div>
                <div className="review-rating">
                  {'⭐'.repeat(Math.max(0, Math.floor(review.rating || 0)))}
                  <span className="rating-value">{review.rating}.0</span>
                </div>
                <div className="review-date">{formatDate(review.created_at)}</div>
              </div>
            </div>
          </div>
          
          {review.text && (
            <div className="review-text">{review.text}</div>
          )}
          
          {review.photos && (() => {
            const reviewPhotos = JSON.parse(review.photos);
            return reviewPhotos.length > 0 && (
              <div className="review-photos">
                {reviewPhotos.map((photo, idx) => (
                  <img key={idx} src={photo} alt="Фото к отзыву" />
                ))}
              </div>
            );
          })()}
          
          {review.master_response && (
            <div className="master-response">
              <div className="response-header">
                <span>👩‍🎨 Ответ мастера</span>
              </div>
              <div className="response-text">{review.master_response}</div>
              <div className="response-date">
                {formatDate(review.responded_at)}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {!compact && reviews.length < total && (
        <button className="load-more-btn" onClick={loadMore} disabled={loading}>
          {loading ? 'Загрузка...' : 'Загрузить ещё'}
        </button>
      )}
    </div>
  );
};

const getDeclension = (number, one, two, five) => {
  const n = Math.abs(number) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return five;
  if (n1 > 1 && n1 < 5) return two;
  if (n1 === 1) return one;
  return five;
};

export default ReviewsList;