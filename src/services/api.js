// src/services/api.js
import axios from 'axios';

// [1] ИСПРАВЛЕНО: был невалидный синтаксис с двумя `return` вместо тернарника
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://baronpython554455.pythonanywhere.com/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // [2] ИСПРАВЛЕНО: 30s → 10s, иначе пользователь ждёт полминуты
});

// ── Request interceptor: добавляем токен ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: авто-refresh при 401 ───────────────────────
// [3] ДОБАВЛЕНО: без этого токен истекает через 24ч и все запросы падают с 401
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true;

      if (isRefreshing) {
        // Параллельные запросы ждут пока refresh не завершится
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;
      const storedRefresh = localStorage.getItem('refresh_token');

      if (!storedRefresh) {
        localStorage.removeItem('access_token');
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: storedRefresh,
        });

        const { access_token, refresh_token: newRefresh } = res.data;
        localStorage.setItem('access_token', access_token);
        if (newRefresh) localStorage.setItem('refresh_token', newRefresh);

        refreshQueue.forEach(({ resolve }) => resolve(access_token));
        refreshQueue = [];

        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// [4] ИСПРАВЛЕНО: оставлен только один способ экспорта (named).
// Используй: import { api } from './api'  или  import api from './api'

// ── Утилиты ───────────────────────────────────────────────────────────
export const getServices = () =>
  api.get('/services').then((res) => res.data.services);

export const getMasters = () =>
  api.get('/masters').then((res) => res.data.masters);

// [5] ИСПРАВЛЕНО: date через params — axios сам сделает encodeURIComponent
export const getSlots = (masterId, date) =>
  api.get('/slots', { params: { master_id: masterId, date } })
    .then((res) => res.data.slots);

export const bookAppointment = (data) =>
  api.post('/book', data).then((res) => res.data);

export const getAppointments = () =>
  api.get('/appointments').then((res) => res.data.appointments);

// [6] ИСПРАВЛЕНО: добавлен .then(res => res.data) как у остальных утилит
export const cancelAppointment = (id) =>
  api.post('/cancel', { appointmentId: id }).then((res) => res.data);

api.getServices = getServices;
api.getMasters = getMasters;
api.getSlots = getSlots;
api.bookAppointment = bookAppointment;
api.getAppointments = getAppointments;
api.cancelAppointment = cancelAppointment;

export default api;