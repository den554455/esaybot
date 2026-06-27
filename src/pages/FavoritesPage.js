import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './FavoritesPage.css';

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    try {
      const response = await api.get('/favorites');
      if (response.data.success) {
        setFavorites(response.data.favorites || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (masterId) => {
    try {
      await api.delete(`/favorites/${masterId}`);
      setFavorites(prev => prev.filter(f => f.id !== masterId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };
  

  if (loading) {
    return <div className="favorites-loading">Загрузка...</div>;
  }

  return (
    <div className="favorites-page">
      <h1>❤️ Избранное</h1>
      
      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <p>У вас пока нет избранных мастеров</p>
          <button onClick={() => navigate('/')}>Найти мастера</button>
        </div>
      ) : (
        <div className="favorites-list">
          {favorites.map(master => (
            <div key={master.id} className="favorite-card">
              <div className="favorite-avatar">
                {master.avatar_url ? (
                  <img src={master.avatar_url} alt={master.name} />
                ) : (
                  <div className="avatar-placeholder">👩‍🎨</div>
                )}
              </div>
              <div className="favorite-info">
                <h3>{master.name}</h3>
                <p>📍 {master.district}</p>
                <div className="rating">
                  {'⭐'.repeat(Math.floor(master.rating || 0))}
                  <span>({master.reviews || 0})</span>
                </div>
              </div>
              <div className="favorite-actions">
                <button className="book-btn" onClick={() => navigate('/masters', { state: { selectedMaster: master.id } })}>
                  Записаться
                </button>
                <button className="remove-btn" onClick={() => removeFavorite(master.id)}>
                  ❌ Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;