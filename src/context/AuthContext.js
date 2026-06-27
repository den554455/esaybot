import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// AuthContext использует единственный axios instance из api.js.
// Это устраняет гонку двух refresh-interceptors, которая вызывала
// периодические 401 и разлогинивание пользователей.

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Вспомогательная: очистка сессии без запроса на сервер ─────────
  const _clearSession = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setError(null);
  };

  // ── Загрузка пользователя при старте ─────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      await new Promise(r => setTimeout(r, 100));
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          _clearSession();
        }
      } catch {
        _clearSession();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // ── login ─────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { access_token, refresh_token, user: userData } = response.data;
        localStorage.setItem('access_token', access_token);
        if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
        setUser(userData);
        return { success: true, user: userData };
      } else {
        const msg = response.data.error || 'Login failed';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка соединения с сервером';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── loginWithToken (для VK, Telegram и т.д.) ──────────────────────
  const loginWithToken = (access_token, refresh_token, userData) => {
      localStorage.setItem('access_token', access_token);
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
      setUser(userData);
    };

  // ── register ──────────────────────────────────────────────────────
  const register = async (email, password, first_name, last_name) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', {
        email, password, first_name, last_name,
      });

      if (response.data.success) {
        const { access_token, refresh_token, user: userData } = response.data;
        localStorage.setItem('access_token', access_token);
        if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
        setUser(userData);
        return { success: true };
      } else {
        const msg = response.data.error || 'Registration failed';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка регистрации';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── register master ───────────────────────────────────────────────
  const registerMaster = async (first_name, last_name, email, phone, district, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/register-master', {
        first_name,
        last_name,
        email,
        phone,
        district,
        password,
      });

      if (response.data.success) {
        const { access_token, refresh_token, user: userData } = response.data;
        localStorage.setItem('access_token', access_token);
        if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
        setUser(userData);
        return { success: true };
      } else {
        const msg = response.data.error || 'Registration failed';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка регистрации';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── logout ────────────────────────────────────────────────────────
  const logout = async () => {
    setError(null);
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await api.post('/auth/logout', {
        refresh_token: refreshToken || undefined,
      });
    } catch {
      // Игнорируем ошибки сервера — всё равно чистим локально
    } finally {
      _clearSession();
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    loginWithToken,
    register,
    registerMaster,
    logout,
    isAuthenticated: !!user,
    api,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
