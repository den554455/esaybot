import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../services/api';
import PortfolioGallery from '../components/PortfolioGallery';
import './MasterProfilePage.css';

const MasterProfilePage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/master/profile');
      if (response.data.success) {
        setProfile(response.data.profile);
        setFormData(response.data.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSocialChange = (platform, value) => {
    setFormData({
      ...formData,
      social_links: { ...(formData.social_links || {}), [platform]: value }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.post('/master/profile', formData);
      if (response.data?.success) {
        setProfile(formData);
        setEditing(false);
        success('Профиль обновлён!');
      } else {
        throw new Error(response.data?.error || 'Ошибка сохранения профиля');
      }
    } catch (error) {
      toastError('Ошибка: ' + (error.message || 'Не удалось сохранить профиль'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Пожалуйста, выберите изображение');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('Аватар должен быть не более 5 МБ');
      return;
    }

    const avatarFormData = new FormData();
    avatarFormData.append('photo', file);

    try {
      const response = await api.post('/master/avatar', avatarFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data;
      if (data.success) {
        setProfile({ ...profile, avatar_url: data.avatar_url });
        setFormData({ ...formData, avatar_url: data.avatar_url });
        success('Аватар обновлён!');
      } else {
        throw new Error(data.error || 'Ошибка загрузки аватара');
      }
    } catch (error) {
      toastError('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return <div className="loading">Загрузка профиля...</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-section">
          <img
            src={profile?.avatar_url || '/default-avatar.svg'}
            alt="Аватар"
            className="avatar"
          />
          {editing && (
            <label className="upload-avatar-btn">
              📷 Загрузить фото
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </label>
          )}
        </div>
        <div className="profile-info">
          <h1>
            {editing ? (
              <input
                value={formData.first_name || ''}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Имя"
              />
            ) : (
              `${profile?.first_name} ${profile?.last_name || ''}`
            )}
          </h1>
          <div className="rating">
            {'⭐'.repeat(Math.floor(profile?.rating || 0))}
            <span>({profile?.reviews_count || 0} отзывов)</span>
          </div>
          <p className="district">📍 {profile?.district}</p>
        </div>
        {!editing ? (
          <button className="edit-btn" onClick={() => setEditing(true)}>✏️ Редактировать</button>
        ) : (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : '💾 Сохранить'}
            </button>
            <button className="cancel-btn" onClick={() => setEditing(false)}>Отмена</button>
          </div>
        )}
      </div>

      <div className="profile-details">
        <div className="detail-section">
          <h3>📝 О себе</h3>
          {editing ? (
            <textarea
              value={formData.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Расскажите о себе, опыте работе..."
              rows={4}
            />
          ) : (
            <p>{profile?.bio || 'Не заполнено'}</p>
          )}
        </div>

        <div className="detail-section">
          <h3>💼 Опыт</h3>
          {editing ? (
            <input
              type="number"
              value={formData.experience_years || 0}
              onChange={(e) => handleChange('experience_years', parseInt(e.target.value))}
            />
          ) : (
            <p>{profile?.experience_years || 0} лет</p>
          )}
        </div>

        <div className="detail-section">
          <h3>📞 Контакты</h3>
          {editing ? (
            <>
              <input type="tel" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Телефон" />
              <input type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" />
              <input type="text" value={formData.address || ''} onChange={(e) => handleChange('address', e.target.value)} placeholder="Адрес салона" />
            </>
          ) : (
            <>
              <p>📞 {profile?.phone || 'Не указан'}</p>
              <p>✉️ {profile?.email || 'Не указан'}</p>
              <p>📍 {profile?.address || 'Не указан'}</p>
            </>
          )}
        </div>

        <div className="detail-section">
          <h3>🌐 Социальные сети</h3>
          {editing ? (
            <>
              <input value={formData.social_links?.instagram || ''} onChange={(e) => handleSocialChange('instagram', e.target.value)} placeholder="Instagram" />
              <input value={formData.social_links?.telegram || ''} onChange={(e) => handleSocialChange('telegram', e.target.value)} placeholder="Telegram" />
              <input value={formData.social_links?.vk || ''} onChange={(e) => handleSocialChange('vk', e.target.value)} placeholder="VK" />
            </>
          ) : (
            <div className="social-links">
              {profile?.social_links?.instagram && <a href={profile.social_links.instagram} target="_blank" rel="noreferrer">📸 Instagram</a>}
              {profile?.social_links?.telegram && <a href={profile.social_links.telegram} target="_blank" rel="noreferrer">💬 Telegram</a>}
              {profile?.social_links?.vk && <a href={profile.social_links.vk} target="_blank" rel="noreferrer">🌐 VK</a>}
            </div>
          )}
        </div>
      </div>

      <div className="portfolio-section">
        <h2>📸 Портфолио</h2>
        <PortfolioGallery masterId={profile?.id} editable={editing} />
      </div>
    </div>
  );
};

export default MasterProfilePage;