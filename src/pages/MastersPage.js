import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PortfolioGallery from '../components/PortfolioGallery';
import ReviewsList from '../components/ReviewsList';
import LoadingSpinner from '../components/LoadingSpinner';
import './MastersPage.css';

const MastersPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedService = location.state?.selectedService;

  const [masters, setMasters] = useState([]);
  const [filteredMasters, setFilteredMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    station: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    service: ''
  });
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [activeMasterTab, setActiveMasterTab] = useState('info');
  const [sortBy, setSortBy] = useState('rating'); // rating, reviews, name
  
  // Доступные станции метро для фильтра
  const stations = useMemo(() => {
    const uniqueStations = [...new Set(masters.map(m => m.district))];
    return uniqueStations.filter(Boolean).sort();
  }, [masters]);

  useEffect(() => {
    loadMasters();
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated]);

  // Применяем фильтры при изменении masters или filters
  useEffect(() => {
    applyFiltersAndSort();
  }, [masters, filters, sortBy]);

  // Получаем masterId из URL при монтировании
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const masterId = params.get('master');
    if (masterId && masters.length > 0) {
      const master = masters.find(m => m.id === parseInt(masterId));
      if (master) {
        setSelectedMaster(master);
      }
    }
  }, [location.search, masters]);

  const loadMasters = async () => {
    try {
      setLoading(true);
      const data = await api.getMasters();
      setMasters(data);
      setFilteredMasters(data);
    } catch (error) {
      console.error('Error loading masters:', error);
      // Показываем уведомление об ошибке
      if (window.showToast) {
        window.showToast('Ошибка загрузки мастеров', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await api.get('/favorites');
      if (response.data.success) {
        const favSet = new Set(response.data.favorites.map(f => f.id));
        setFavorites(favSet);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...masters];
    
    // Фильтр по станции метро
    if (filters.station) {
      filtered = filtered.filter(m => 
        m.district?.toLowerCase().includes(filters.station.toLowerCase())
      );
    }
    
    // Фильтр по минимальной цене
    if (filters.minPrice) {
      filtered = filtered.filter(m => 
        m.min_price && m.min_price >= parseInt(filters.minPrice)
      );
    }
    
    // Фильтр по максимальной цене
    if (filters.maxPrice) {
      filtered = filtered.filter(m => 
        m.min_price && m.min_price <= parseInt(filters.maxPrice)
      );
    }
    
    // Фильтр по минимальному рейтингу
    if (filters.minRating) {
      filtered = filtered.filter(m => 
        m.rating >= parseFloat(filters.minRating)
      );
    }
    
    // Фильтр по услуге
    if (filters.service) {
      filtered = filtered.filter(m => 
        m.services && m.services.some(s => 
          s.name?.toLowerCase().includes(filters.service.toLowerCase())
        )
      );
    }
    
    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return (b.reviews || 0) - (a.reviews || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });
    
    setFilteredMasters(filtered);
  }, [masters, filters, sortBy]);

  const toggleFavorite = async (masterId, event) => {
    if (event) event.stopPropagation();
    
    if (!isAuthenticated) {
      if (window.showToast) {
        window.showToast('Войдите в аккаунт, чтобы добавить в избранное', 'warning');
      } else {
        alert('Войдите в аккаунт, чтобы добавить в избранное');
      }
      return;
    }
    
    try {
      if (favorites.has(masterId)) {
        await api.delete(`/favorites/${masterId}`);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(masterId);
          return newSet;
        });
        if (window.showToast) {
          window.showToast('Удалено из избранного', 'success');
        }
      } else {
        await api.post(`/favorites/${masterId}`);
        setFavorites(prev => new Set(prev).add(masterId));
        if (window.showToast) {
          window.showToast('Добавлено в избранное', 'success');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (window.showToast) {
        window.showToast('Ошибка при изменении избранного', 'error');
      }
    }
  };

  const handleMasterSelect = (master) => {
    setSelectedMaster(master);
    setActiveMasterTab('info');
    // Обновляем URL без перезагрузки страницы
    navigate(`?master=${master.id}`, {
      replace: true,
      state: location.state
    });
  };

  const closeModal = () => {
    setSelectedMaster(null);
    navigate('.', {
    replace: true,
    state: location.state

  });

};

  const clearFilters = () => {
    setFilters({
      station: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      service: ''
    });
    setSortBy('rating');
  };

  const getRatingStars = (rating) => {
    const safeRating = rating || 0;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(safeRating);
    
    return (
      <>
        {'⭐'.repeat(fullStars)}
        {hasHalfStar && '½'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  if (loading) {
    return (
      <div className="masters-page">
        <LoadingSpinner text="Загрузка мастеров..." />
      </div>
    );
  }

  return (
    <div className="masters-page">
      <div className="filters-section">
        <div className="filters-bar">
          <div className="filter-group">
            <select
              value={filters.station}
              onChange={(e) => setFilters({...filters, station: e.target.value})}
              className="filter-select"
            >
              <option value="">Все станции метро</option>
              {stations.map(station => (
                <option key={station} value={station}>{station}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <input
              type="number"
              placeholder="Мин. цена"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <input
              type="number"
              placeholder="Макс. цена"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={filters.minRating}
              onChange={(e) => setFilters({...filters, minRating: e.target.value})}
              className="filter-select"
            >
              <option value="">Любой рейтинг</option>
              <option value="4.5">4.5+ ★</option>
              <option value="4.0">4.0+ ★</option>
              <option value="3.5">3.5+ ★</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="rating">По рейтингу</option>
              <option value="reviews">По отзывам</option>
              <option value="name">По имени</option>
            </select>
          </div>
          
          <button onClick={clearFilters} className="clear-filters-btn">
            🗑️ Сбросить
          </button>
        </div>
      </div>

      <div className="masters-stats">
        Найдено мастеров: {filteredMasters.length}
      </div>

      {filteredMasters.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>Мастера не найдены</h3>
          <p>Попробуйте изменить параметры поиска</p>
          <button onClick={clearFilters} className="reset-filters-btn">
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="masters-list">
          {filteredMasters.map(master => (
            <div 
              key={master.id} 
              className="master-card" 
              onClick={() => handleMasterSelect(master)}
            >
              <div className="master-avatar">
                {master.avatar_url ? (
                  <img src={master.avatar_url} alt={master.name} />
                ) : (
                  <div className="avatar-placeholder">👩‍🎨</div>
                )}
              </div>
              <div className="master-info">
                <div className="master-name-row">
                  <h3>{master.name}</h3>
                  <button 
                    className={`favorite-btn ${favorites.has(master.id) ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(master.id, e)}
                    aria-label={favorites.has(master.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                  >
                    {favorites.has(master.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                <p className="master-district">📍 {master.district || 'Район не указан'}</p>
                <div className="master-rating">
                  {getRatingStars(master.rating)}
                  <span className="rating-value">{master.rating}</span>
                  <span className="reviews-count">({master.reviews || 0} отзывов)</span>
                </div>
                {master.min_price && (
                  <p className="master-price">от {master.min_price.toLocaleString()} ₽</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMaster && (
        <div className="master-modal" onClick={closeModal}>
          <div className="master-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            
            <div className="modal-header">
              <div className="modal-avatar">
                {selectedMaster.avatar_url ? (
                  <img src={selectedMaster.avatar_url} alt={selectedMaster.name} />
                ) : (
                  <div className="avatar-placeholder large">👩‍🎨</div>
                )}
              </div>
              <div className="modal-title">
                <h2>{selectedMaster.name}</h2>
                <p className="modal-district">📍 {selectedMaster.district || 'Район не указан'}</p>
                <div className="modal-rating">
                  {getRatingStars(selectedMaster.rating)}
                  <span>{selectedMaster.rating} ({selectedMaster.reviews || 0} отзывов)</span>
                </div>
              </div>
              <button 
                className={`modal-favorite ${favorites.has(selectedMaster.id) ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(selectedMaster.id, e)}
              >
                {favorites.has(selectedMaster.id) ? '❤️ В избранном' : '🤍 В избранное'}
              </button>
            </div>
            
            <div className="modal-tabs">
              <button 
                className={activeMasterTab === 'info' ? 'active' : ''} 
                onClick={() => setActiveMasterTab('info')}
              >
                📋 Информация
              </button>
              <button 
                className={activeMasterTab === 'portfolio' ? 'active' : ''} 
                onClick={() => setActiveMasterTab('portfolio')}
              >
                📸 Портфолио
              </button>
              <button 
                className={activeMasterTab === 'reviews' ? 'active' : ''} 
                onClick={() => setActiveMasterTab('reviews')}
              >
                💬 Отзывы ({selectedMaster.reviews || 0})
              </button>
            </div>
            
            <div className="modal-body">
              {activeMasterTab === 'info' && (
                <div className="master-info-content">
                  <div className="info-block">
                    <h4>📝 О мастере</h4>
                    <p>{selectedMaster.description || 'Информация пока не добавлена'}</p>
                  </div>
                  <div className="info-block">
                    <h4>💼 Опыт</h4>
                    <p>{selectedMaster.experience_years 
                      ? `${selectedMaster.experience_years} лет` 
                      : 'Информация не указана'}
                    </p>
                  </div>
                  {selectedMaster.services && selectedMaster.services.length > 0 && (
                    <div className="info-block">
                      <h4>💅 Услуги</h4>
                      <div className="services-list">
                        {selectedMaster.services.map((service, idx) => (
                          <span key={idx} className="service-tag">
                            {service.name || service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedMaster.phone && (
                    <div className="info-block">
                      <h4>📞 Контакты</h4>
                      <a href={`tel:${selectedMaster.phone}`} className="contact-link">
                        {selectedMaster.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
              {activeMasterTab === 'portfolio' && (
                <PortfolioGallery masterId={selectedMaster.id} />
              )}
              {activeMasterTab === 'reviews' && (
                <ReviewsList masterId={selectedMaster.id} />
              )}
            </div>
            
            <button 
              className="book-btn" 
              onClick={() =>
                navigate('/calendar', {
                  state: {
                    master: selectedMaster,
                    service: selectedService,
                  },
                })}
            >
              📅 Записаться
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MastersPage;