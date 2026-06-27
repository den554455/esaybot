import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './MasterPanelPage.css';

const MasterPanelPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Проверка прав доступа (после всех хуков)
  const hasAccess = isAuthenticated && (user?.role === 'master' || user?.role === 'admin');

  useEffect(() => {
    if (hasAccess) {
      loadAppointments();
      loadStats();
    }
  }, [hasAccess]);

  // Фильтрация записей
  useEffect(() => {
    filterAppointments();
  }, [appointments, filterStatus]);

  const filterAppointments = () => {
    if (filterStatus === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(appointments.filter(a => a.status === filterStatus));
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/master/appointments');
      if (response.data.success) {
        const formatted = (response.data.appointments || []).map(appt => ({
          ...appt,
          date: appt.date_time?.split(' ')[0] || appt.date,
          time: appt.date_time?.split(' ')[1] || appt.time,
          client_name: appt.client_name || `${appt.first_name || ''} ${appt.last_name || ''}`.trim() || 'Клиент'
        }));
        setAppointments(formatted);
      } else {
        setError(response.error || 'Ошибка загрузки записей');
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/master/stats');
      if (response.data.success) {
        setStats(response.data.stats || { total: 0, confirmed: 0, pending: 0, revenue: 0 });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleConfirm = async (appointmentId) => {
    try {
      const response = await api.post(`/master/confirm/${appointmentId}`, {});
      if (response.data.success) {
        setAppointments(prev =>
          prev.map(a => a.id === appointmentId ? { ...a, status: 'confirmed' } : a)
        );
        await loadStats();
        if (window.showToast) {
          window.showToast('Запись подтверждена', success('Запись подтверждена'));
        }
      } else {
        setError(response.data?.error || 'Ошибка подтверждения');
      }
    } catch (err) {
      console.error('Error confirming appointment:', err);
      setError('Не удалось подтвердить запись');
    }
  };

  const handleComplete = async (appointmentId) => {
  if (!window.confirm('Отметить запись как выполненную?')) return;

  try {
    const response = await api.post(`/master/complete/${appointmentId}`, {});

    if (response.data.success) {
      setAppointments(prev =>
        prev.map(a =>
          a.id === appointmentId
            ? { ...a, status: 'completed' }
            : a
        )
      );

      await loadStats();

      if (window.showToast) {
        window.showToast('Запись завершена', success('Запись завершена'));
      }
    } else {
      setError(response.data?.error || 'Ошибка');
    }
  } catch (err) {
    console.error('Error completing appointment:', err);
    setError('Не удалось отметить запись');
  }
};

  const handleCancel = async (appointmentId) => {
  if (!window.confirm('Отменить эту запись?')) return;

  try {
    const response = await api.post(`/master/cancel/${appointmentId}`, {});

    if (response.data.success) {
      setAppointments(prev =>
        prev.map(a =>
          a.id === appointmentId
            ? { ...a, status: 'cancelled' }
            : a
        )
      );

      await loadStats();

      if (window.showToast) {
        window.showToast('Запись отменена', success('Запись отменена'));
      }
    } else {
      setError(response.data?.error || 'Ошибка отмены');
    }
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    setError('Не удалось отменить запись');
  }
};

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', text: '⏳ Ожидает', icon: '⏳' },
      confirmed: { class: 'status-confirmed', text: '✅ Подтверждена', icon: '✅' },
      completed: { class: 'status-completed', text: '✨ Выполнена', icon: '✨' },
      cancelled: { class: 'status-cancelled', text: '❌ Отменена', icon: '❌' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.icon} {config.text}</span>;
  };

  // Проверка прав после всех хуков (ранний return)
  if (!isAuthenticated) {
    return (
      <div className="master-panel">
        <div className="error-container">
          <div className="error-icon">🔐</div>
          <h2>Требуется авторизация</h2>
          <p>Пожалуйста, войдите в систему.</p>
          <button onClick={() => navigate('/login')} className="login-btn">
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="master-panel">
        <div className="error-container">
          <div className="error-icon">🚫</div>
          <h2>Доступ запрещён</h2>
          <p>У вас нет прав для просмотра этой страницы.</p>
          <button onClick={() => navigate('/')} className="back-btn">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="master-panel">
      <div className="panel-header">
        <div className="header-title">
          <h1>👩‍🎨 Панель мастера</h1>
          <p className="header-subtitle">Управляйте своими записями</p>
        </div>
        <div className="header-actions">
          <span className="master-name">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="master-avatar-small" />
            ) : (
              '👩‍🎨'
            )}
            {user?.first_name || user?.name || 'Мастер'}
          </span>
          <button className="schedule-btn" onClick={() => navigate('/schedule')}>
            📅 Расписание
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="stats-cards">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Всего записей</h3>
            <p>{stats.total}</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Ожидают</h3>
            <p>{stats.pending || 0}</p>
          </div>
        </div>
        <div className="stat-card confirmed">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Подтверждено</h3>
            <p>{stats.confirmed}</p>
          </div>
        </div>
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Выручка</h3>
            <p>{Number(stats.revenue).toLocaleString()} ₽</p>
          </div>
        </div>
      </div>

      <div className="appointments-section">
        <div className="section-header">
          <h2>📋 Записи ко мне</h2>
          <div className="filters">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все записи</option>
              <option value="pending">Ожидают</option>
              <option value="confirmed">Подтверждённые</option>
              <option value="completed">Выполненные</option>
              <option value="cancelled">Отменённые</option>
            </select>
            <button 
              className="refresh-btn" 
              onClick={() => { loadAppointments(); loadStats(); }}
              disabled={loading}
            >
              🔄
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <LoadingSpinner size="medium" text="Загрузка записей..." />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Нет записей</h3>
            <p>
              {filterStatus !== 'all' 
                ? 'Нет записей с выбранным статусом' 
                : 'У вас пока нет записей'}
            </p>
            {filterStatus !== 'all' && (
              <button onClick={() => setFilterStatus('all')} className="reset-filter-btn">
                Сбросить фильтр
              </button>
            )}
          </div>
        ) : (
          <div className="appointments-list">
            {filteredAppointments.map(appt => (
              <div key={appt.id} className={`appointment-item ${appt.status}`}>
                <div className="appointment-header">
                  <div className="client-info">
                    <div className="client-avatar">
                      {appt.client_avatar ? (
                        <img src={appt.client_avatar} alt={appt.client_name} />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div>
                      <strong className="client-name">{appt.client_name}</strong>
                      {getStatusBadge(appt.status)}
                    </div>
                  </div>
                </div>
                
                <div className="appointment-details">
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span>{appt.date} в {appt.time}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">💅</span>
                    <span>{appt.service}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">💰</span>
                    <span>{Number(appt.price).toLocaleString()} ₽</span>
                  </div>
                  {appt.comment && (
                    <div className="detail-row comment">
                      <span className="detail-icon">📝</span>
                      <span>{appt.comment}</span>
                    </div>
                  )}
                </div>
                
                <div className="appointment-footer">
                  {appt.status === 'pending' && (
                    <>
                      <button className="confirm-btn" onClick={() => handleConfirm(appt.id)}>
                        ✅ Подтвердить
                      </button>
                      <button className="cancel-btn" onClick={() => handleCancel(appt.id)}>
                        ❌ Отменить
                      </button>
                    </>
                  )}
                  {appt.status === 'confirmed' && (
                    <>
                      <button className="complete-btn" onClick={() => handleComplete(appt.id)}>
                        ✨ Выполнено
                      </button>
                      <button className="cancel-btn" onClick={() => handleCancel(appt.id)}>
                        ❌ Отменить
                      </button>
                    </>
                  )}
                  {appt.status === 'completed' && (
                    <span className="completed-badge">✨ Завершено</span>
                  )}
                  {appt.status === 'cancelled' && (
                    <span className="cancelled-badge">❌ Отменено</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterPanelPage;