import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import api from '../services/api';

const AdminReviews = () => {
  const { success, error: toastError } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');

  useEffect(() => { loadReviews(); }, [status]);

  const loadReviews = async () => {
    try {
      const response = await api.get(`/admin/reviews?status=${status}`);
      if (response.data.success) setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reviewId, newStatus) => {
    try {
      await api.post(`/admin/reviews/${reviewId}`, { status: newStatus });
      success(newStatus === 'approved' ? 'Отзыв одобрен' : 'Отзыв отклонён');
      loadReviews();
    } catch (error) {
      toastError('Ошибка: ' + error.message);
    }
  };

  return (
    <div className="admin-reviews">
      <div className="section-header">
        <h2>Модерация отзывов</h2>
        <div className="status-filter">
          <button className={status === 'pending' ? 'active' : ''} onClick={() => setStatus('pending')}>⏳ На проверке</button>
          <button className={status === 'approved' ? 'active' : ''} onClick={() => setStatus('approved')}>✅ Одобренные</button>
          <button className={status === 'rejected' ? 'active' : ''} onClick={() => setStatus('rejected')}>❌ Отклонённые</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="reviews-list">
          {reviews.length === 0 ? (
            <div className="empty">Нет отзывов</div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="reviewer">{review.first_name} {review.last_name}</div>
                  <div className="review-rating">{'⭐'.repeat(review.rating)}</div>
                  <div className="review-date">{new Date(review.created_at).toLocaleString()}</div>
                </div>
                <div className="review-master">👩‍🎨 Мастер: {review.master_first_name} {review.master_last_name}</div>
                <div className="review-text">{review.text}</div>
                {review.master_response && (
                  <div className="master-response">
                    <strong>Ответ мастера:</strong>
                    <p>{review.master_response}</p>
                  </div>
                )}
                {status === 'pending' && (
                  <div className="review-actions">
                    <button className="approve-btn" onClick={() => updateStatus(review.id, 'approved')}>✅ Одобрить</button>
                    <button className="reject-btn" onClick={() => updateStatus(review.id, 'rejected')}>❌ Отклонить</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;