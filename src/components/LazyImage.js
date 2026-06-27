import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

const LazyImage = ({ src, alt, className, placeholderColor = '#2A2A2A' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={imgRef} 
      className={`lazy-image-container ${className || ''}`}
      style={{ backgroundColor: placeholderColor }}
    >
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
      {!isLoaded && isInView && (
        <div className="image-placeholder">
          <div className="placeholder-shimmer"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;