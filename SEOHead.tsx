import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SportsEvent } from '../types';
import { getEventDetailUrl } from '../lib/categoryUtils';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article' | 'business';
  event?: SportsEvent | null;
}

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  canonicalUrl,
  type = 'website',
  event
}) => {
  let metaTitle = "SporPuan - Türkiye'nin Bağımsız Spor Tesisleri, Salonları ve Etkinlikleri Puanlama Platformu";
  let metaDescription = "Türkiye'nin en kapsamlı bağımsız spor tesisi, spor salonu, spor okulu ve organizasyon puanlama ve inceleme platformu. 5 farklı boyutta objektif analizler ve tarafsız yorumlar.";
  let metaKeywords = "spor puan, spor salonu yorumları, spor tesisleri, macfit puanı, spor okulları, halı saha puanlama, maraton takvimi, boks salonları, pilates stüdyoları";
  let metaImage = image || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop";
  let currentCanonical = canonicalUrl || window.location.origin + window.location.pathname;

  if (event) {
    const catName = event.category || 'Spor Tesisi';
    const scoreStr = event.overallScore ? Number(event.overallScore).toFixed(1) : '8.8';
    const cityStr = event.city ? `${event.city}` : 'Türkiye';
    const reviewCountStr = event.reviewCount || (event.reviews ? event.reviews.length : 0);

    metaTitle = `⭐ ${event.title} Puanı & Yorumları (${scoreStr}/10) | ${catName} - SporPuan`;
    metaDescription = `${event.title} (${cityStr}) için sporseverler tarafından verilen ${scoreStr}/10 puanı, ${reviewCountStr} gerçek kullanıcı yorumu, hijyen, ekipman, eğitmen kadrosu ve lokasyon detaylı kriter incelemesi.`;
    metaKeywords = `${event.title}, ${event.title} yorumları, ${event.title} puanı, ${cityStr} ${catName}, ${event.venue || ''}, spor salonu tavsiyesi, sporpuan`;
    
    if (event.image) {
      metaImage = event.image;
    }
    currentCanonical = window.location.origin + getEventDetailUrl(event);
  } else if (title) {
    metaTitle = `${title} | SporPuan`;
    if (description) {
      metaDescription = description;
    }
    if (keywords) {
      metaKeywords = keywords;
    }
  }

  let schemaData: any = {};
  if (event) {
    let schemaType = 'SportsActivityLocation';
    if (event.category === 'Spor Okulları') schemaType = 'EducationalOrganization';
    else if (event.category === 'Spor Etkinlikleri') schemaType = 'SportsEvent';
    else if (event.category === 'Spor Salonları') schemaType = 'HealthClub';

    schemaData = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      'name': event.title,
      'description': event.description || `${event.title} detaylı puanlaması ve incelemesi.`,
      'image': metaImage,
      'url': currentCanonical,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': event.city || 'İstanbul',
        'streetAddress': event.venue || event.title
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': event.overallScore ? Number(event.overallScore).toFixed(1) : '8.8',
        'bestRating': '10',
        'worstRating': '1',
        'ratingCount': event.reviewCount || (event.reviews ? event.reviews.length : 1)
      }
    };
  } else {
    schemaData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': 'https://sporpuan.com/#website',
          'url': window.location.origin,
          'name': 'SporPuan',
          'description': metaDescription,
          'publisher': {
            '@id': 'https://sporpuan.com/#organization'
          },
          'potentialAction': {
            '@type': 'SearchAction',
            'target': `${window.location.origin}/?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'Organization',
          '@id': 'https://sporpuan.com/#organization',
          'name': 'SporPuan',
          'url': window.location.origin,
          'logo': {
            '@type': 'ImageObject',
            'url': `${window.location.origin}/sporpuan-logo.svg`
          },
          'sameAs': [
            'https://instagram.com/sporpuan',
            'https://twitter.com/sporpuan'
          ]
        }
      ]
    };
  }

  return (
    <Helmet prioritizeSeoTags>
      <title>{metaTitle}</title>
      <meta name="title" content={metaTitle} />
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />

      <link rel="canonical" href={currentCanonical} />

      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={currentCanonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="SporPuan" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      <script type="application/ld+json" id={`sporpuan-jsonld${event ? '-' + event.id : ''}`}>
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};
