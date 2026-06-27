import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = 'Easy Bot — запись к бьюти-мастерам',
  description = 'Удобная запись к мастерам маникюра, педикюра, бровей и ресниц в Москве. Поиск по метро и бюджету.',
  keywords = 'маникюр, педикюр, брови, ресницы, депиляция, запись к мастеру',
  image = '/og-image.png',
  url = 'https://easy-bot-app.netlify.app/'
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;