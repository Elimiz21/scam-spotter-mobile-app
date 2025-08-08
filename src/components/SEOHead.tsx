// SEO Head Component for Meta Tags and Structured Data
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageSEO } from '@/lib/seo';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  structuredData?: any[];
  breadcrumbs?: Array<{ name: string; url: string }>;
  article?: {
    author: string;
    datePublished: string;
    dateModified?: string;
  };
}

const DEFAULT_CONFIG = {
  siteName: 'ScamShield',
  siteUrl: 'https://www.scamshiel.com',
  defaultTitle: 'ScamShield - Advanced Scam Protection & Detection',
  defaultDescription: 'Protect yourself from scams, phishing, and fraud with AI-powered detection. Real-time alerts, threat intelligence, and comprehensive security.',
  defaultImage: 'https://www.scamshiel.com/images/og-image.png',
  twitterHandle: '@ScamShield',
};

export function SEOHead({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage,
  ogType = 'website',
  noIndex = false,
  noFollow = false,
  structuredData = [],
  breadcrumbs = [],
  article
}: SEOHeadProps) {
  const fullTitle = title 
    ? `${title} | ${DEFAULT_CONFIG.siteName}`
    : DEFAULT_CONFIG.defaultTitle;
  
  const metaDescription = description || DEFAULT_CONFIG.defaultDescription;
  const imageUrl = ogImage || DEFAULT_CONFIG.defaultImage;
  const url = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : DEFAULT_CONFIG.siteUrl);

  // Generate robots directive
  const robotsDirective = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow',
    'max-snippet:-1',
    'max-image-preview:large',
    'max-video-preview:-1'
  ].join(', ');

  // Generate structured data scripts
  const structuredDataScripts = [
    // Organization Schema
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ScamShield',
      url: DEFAULT_CONFIG.siteUrl,
      logo: `${DEFAULT_CONFIG.siteUrl}/images/logo.png`,
      description: 'Advanced scam protection and fraud detection platform powered by AI.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Security Blvd',
        addressLocality: 'San Francisco',
        addressRegion: 'CA',
        postalCode: '94105',
        addressCountry: 'US'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-SCAM-SHIELD',
        contactType: 'Customer Service',
        email: 'support@scamshiel.com'
      },
      sameAs: [
        'https://twitter.com/ScamShield',
        'https://facebook.com/ScamShield',
        'https://linkedin.com/company/scamshield'
      ]
    },
    
    // Website Schema
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: DEFAULT_CONFIG.siteName,
      url: DEFAULT_CONFIG.siteUrl,
      description: DEFAULT_CONFIG.defaultDescription,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${DEFAULT_CONFIG.siteUrl}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    },

    // Breadcrumbs if provided
    ...(breadcrumbs.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    }] : []),

    // Article schema if provided
    ...(article ? [{
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: metaDescription,
      author: {
        '@type': 'Person',
        name: article.author
      },
      publisher: {
        '@type': 'Organization',
        name: DEFAULT_CONFIG.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${DEFAULT_CONFIG.siteUrl}/images/logo.png`
        }
      },
      datePublished: article.datePublished,
      dateModified: article.dateModified || article.datePublished,
      image: imageUrl,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url
      }
    }] : []),

    // Additional structured data
    ...structuredData
  ];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <meta name="robots" content={robotsDirective} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={DEFAULT_CONFIG.siteName} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content={DEFAULT_CONFIG.twitterHandle} />
      <meta name="twitter:creator" content={DEFAULT_CONFIG.twitterHandle} />
      
      {/* Additional Meta Tags for Security/Privacy */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      <meta name="application-name" content="ScamShield" />
      <meta name="apple-mobile-web-app-title" content="ScamShield" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Security Headers */}
      <meta http-equiv="X-Content-Type-Options" content="nosniff" />
      <meta http-equiv="X-Frame-Options" content="DENY" />
      <meta http-equiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Language and Locale */}
      <meta http-equiv="content-language" content="en" />
      <meta property="og:locale" content="en_US" />
      
      {/* Structured Data */}
      {structuredDataScripts.map((schema, index) => (
        <script 
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(schema, null, 2)
          }}
        />
      ))}
      
      {/* Preconnect to External Domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.scamshiel.com" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      
      {/* Alternate Languages */}
      <link rel="alternate" hrefLang="en" href={`${DEFAULT_CONFIG.siteUrl}/en`} />
      <link rel="alternate" hrefLang="es" href={`${DEFAULT_CONFIG.siteUrl}/es`} />
      <link rel="alternate" hrefLang="fr" href={`${DEFAULT_CONFIG.siteUrl}/fr`} />
      <link rel="alternate" hrefLang="x-default" href={DEFAULT_CONFIG.siteUrl} />
    </Helmet>
  );
}

export default SEOHead;