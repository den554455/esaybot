import React, { useEffect, useRef } from 'react';
import api from '../services/api';

const VKLinkButton = ({ onSuccess, onError }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const loadVK = async () => {
      if (window.VKIDSDK) { initVK(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
      script.async = true;
      script.onload = initVK;
      document.body.appendChild(script);
    };

    const initVK = () => {
      const VKID = window.VKIDSDK;
      if (!VKID) return;

      VKID.Config.init({
        app: 54645408,
        redirectUrl: 'https://easy-bot-app.website.yandexcloud.net',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        appName: 'Easy Bot',
      });

      const oneTap = new VKID.OneTap();
      oneTap.render({
        container: containerRef.current,
        showAlternativeLogin: true,
      });

      oneTap
        .on(VKID.WidgetEvents.ERROR, (e) => {
          console.error('VK ERROR', e);
          onError && onError('Ошибка VK виджета');
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload) => {
          try {
            const result = await VKID.Auth.exchangeCode(
              payload.code,
              payload.device_id
            );
            const response = await api.post('/auth/vk/link', {
              id_token: result.id_token,
            });
            if (response.data.success) {
              onSuccess && onSuccess();
            } else {
              onError && onError(response.data.error);
            }
          } catch (e) {
            console.error('VK LINK ERROR', e);
            onError && onError('Ошибка привязки VK');
          }
        });
    };

    loadVK();
  }, []);

  return <div ref={containerRef} />;
};

export default VKLinkButton;