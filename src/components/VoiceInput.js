import React, { useState, useEffect } from 'react';
import './VoiceInput.css';

const VoiceInput = ({ onResult, onError, buttonOnly = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Проверка поддержки Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupported(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.lang = 'ru-RU';
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) {
        onResult(transcript);
      }
      setIsListening(false);
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (onError) {
        onError(event.error);
      }
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
  }, [onResult, onError]);

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  if (!supported) {
    return null;
  }

  if (buttonOnly) {
    return (
      <button
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
        title={isListening ? 'Остановить запись' : 'Голосовой ввод'}
      >
        🎤
      </button>
    );
  }

  return (
    <div className="voice-input">
      <button
        className={`voice-trigger ${isListening ? 'active' : ''}`}
        onClick={isListening ? stopListening : startListening}
      >
        <span className="voice-icon">🎤</span>
        {isListening ? (
          <span className="voice-status">Слушаю... Нажмите для остановки</span>
        ) : (
          <span className="voice-status">Голосовой поиск</span>
        )}
      </button>
      {isListening && (
        <div className="voice-wave">
          <span></span><span></span><span></span><span></span>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;