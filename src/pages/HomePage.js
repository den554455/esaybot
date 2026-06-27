import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ServiceCard from '../components/ServiceCard';
import PhotoSearch from '../components/PhotoSearch';
import LoadingSpinner from '../components/LoadingSpinner';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  useEffect(() => {
    loadServices();
    if (isAuthenticated && user) {
      setWelcomeMessage(`Добро пожаловать, ${user.first_name || user.email || 'гость'}! 👋`);
    } else {
      setWelcomeMessage('Добро пожаловать в Easy Bot! 👋');
    }
  }, [isAuthenticated, user]);

  const loadServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service) => {
    navigate('/masters', { state: { selectedService: service } });
  };

  if (loading) {
    return (
      <div className="home-page">
        <LoadingSpinner text="Загрузка услуг..." />
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>💅 Easy Bot</h1>
        <p className="subtitle">Запись к бьюти-мастерам онлайн</p>
      </div>

      {welcomeMessage && (
        <div className="welcome-banner">
          <h2>{welcomeMessage}</h2>
          <p>Выберите услугу, чтобы начать</p>
        </div>
      )}

      <div className="services-section">
        <div className="section-title">
          <span className="emoji">💅</span>
          <span>Наши услуги</span>
        </div>
        <div className="services-grid">
          {services.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onClick={() => handleServiceSelect(service)}
            />
          ))}
        </div>
      </div>

      <div className="info-panel">
        <div className="info-row">
          <span className="info-label">📍 Работаем в Москве</span>
          <span className="info-value">Более 50 мастеров</span>
        </div>
        <div className="info-row">
          <span className="info-label">⏰ Работаем ежедневно</span>
          <span className="info-value">с 9:00 до 21:00</span>
        </div>
        <div className="info-row">
          <span className="info-label">💳 Оплата онлайн</span>
          <span className="info-value">Безопасно и удобно</span>
        </div>
      </div>

      <div className="recent-info">
        <div className="hint">
          💡 Совет: зарегистрируйтесь, чтобы отслеживать свои записи
        </div>
      </div>

      <button 
        className="quick-book-btn"
        onClick={() => navigate('/masters')}
        aria-label="Быстрая запись"
      >
        📅
      </button>
    </div>
  );
};

export default HomePage;