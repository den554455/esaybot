import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import api from '../services/api';

const AdminMasters = () => {
  const { success, error: toastError } = useToast();
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMasters(); }, []);

  const loadMasters = async () => {
    try {
      const response = await api.get('/admin/masters');
      if (response.data.success) setMasters(response.data.masters);
    } catch (error) {
      console.error('Error loading masters:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMaster = async (masterId) => {
    if (!window.confirm('Удалить мастера и все его записи?')) return;
    try {
      await api.delete(`/admin/masters/${masterId}`);
      success('Мастер удалён');
      loadMasters();
    } catch (error) {
      toastError('Ошибка: ' + error.message);
    }
  };

  return (
    <div className="admin-masters">
      <div className="section-header">
        <h2>Список мастеров</h2>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="masters-table">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Имя</th><th>Район</th><th>Рейтинг</th><th>Email</th><th>Дата регистрации</th><th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {masters.map(master => (
                <tr key={master.master_id}>
                  <td>{master.master_id}</td>
                  <td>{master.first_name} {master.last_name}</td>
                  <td>{master.district}</td>
                  <td>⭐ {master.rating} ({master.reviews_count})</td>
                  <td>{master.email || '-'}</td>
                  <td>{new Date(master.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="delete-btn" onClick={() => deleteMaster(master.master_id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminMasters;