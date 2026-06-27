import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import VoiceInput from './VoiceInput';
import './SmartSearch.css';

const SmartSearch = ({ placeholder = "Поиск мастеров, услуг...", onSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Поиск мастеров
      const masters = await api.getMasters({ search: query });
      // Поиск услуг
      const services = await api.getServices();
      const matchedServices = services.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSuggestions([
        ...matchedServices.slice(0, 3).map(s => ({ type: 'service', ...s })),
        ...masters.slice(0, 5).map(m => ({ type: 'master', ...m }))
      ]);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceResult = (transcript) => {
    setQuery(transcript);
    setShowSuggestions(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    } else if (item.type === 'service') {
      navigate('/masters', { state: { service: item } });
    } else if (item.type === 'master') {
      navigate(`/calendar?master=${item.id}`);
    }
    setShowSuggestions(false);
    setQuery('');
  };

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/masters?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="smart-search">
      <div className="search-container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={placeholder}
          className="search-input"
        />
        <VoiceInput onResult={handleVoiceResult} buttonOnly />
        <button className="search-button" onClick={handleSearch}>
          🔍
        </button>
      </div>
      
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="suggestions-dropdown" ref={suggestionsRef}>
          {loading && (
            <div className="suggestion-loading">Загрузка...</div>
          )}
          {suggestions.map((item, idx) => (
            <div
              key={`${item.type}-${idx}`}
              className="suggestion-item"
              onClick={() => handleSelect(item)}
            >
              <div className="suggestion-icon">
                {item.type === 'service' ? '💅' : '👩‍🎨'}
              </div>
              <div className="suggestion-content">
                <div className="suggestion-title">
                  {item.type === 'service' ? item.name : item.name}
                </div>
                {item.type === 'master' && (
                  <div className="suggestion-subtitle">
                    📍 {item.district} | ⭐ {item.rating}
                  </div>
                )}
                {item.type === 'service' && (
                  <div className="suggestion-subtitle">
                    от {item.price.toLocaleString()} ₽
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;