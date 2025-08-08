// Comprehensive SEO Optimization Library
import { logger } from './logger';

// SEO Configuration Types
export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  defaultImage: string;
  twitterHandle: string;
  facebookAppId?: string;
  organizationSchema: OrganizationSchema;
  defaultLanguage: string;
  supportedLanguages: string[];
}

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  structuredData?: any[];
  breadcrumbs?: Breadcrumb[];
}

export interface Breadcrumb {
  name: string;
  url: string;
}

export interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint: {
    telephone: string;
    contactType: string;
    email: string;
  };
  sameAs: string[];
}

// Default SEO Configuration
const DEFAULT_SEO_CONFIG: SEOConfig = {
  siteName: 'ScamShield',
  siteUrl: 'https://www.scamshiel.com',
  defaultTitle: 'ScamShield - Advanced Scam Protection & Detection',
  defaultDescription: 'Protect yourself from scams, phishing, and fraud with AI-powered detection. Real-time alerts, threat intelligence, and comprehensive security for calls, emails, and web browsing.',
  defaultKeywords: [
    'scam protection', 'phishing detection', 'fraud prevention', 'security app',
    'AI threat detection', 'call blocking', 'email security', 'online safety',
    'cybersecurity', 'identity theft protection', 'mobile security'
  ],
  defaultImage: 'https://www.scamshiel.com/images/og-image.png',
  twitterHandle: '@ScamShield',
  facebookAppId: '123456789',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'de', 'it'],
  organizationSchema: {
    name: 'ScamShield',
    url: 'https://www.scamshiel.com',
    logo: 'https://www.scamshiel.com/images/logo.png',
    description: 'Advanced scam protection and fraud detection platform powered by AI.',
    address: {
      streetAddress: '123 Security Blvd',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94105',
      addressCountry: 'US'
    },
    contactPoint: {
      telephone: '+1-555-SCAM-SHIELD',
      contactType: 'Customer Service',
      email: 'support@scamshiel.com'
    },
    sameAs: [
      'https://twitter.com/ScamShield',
      'https://facebook.com/ScamShield',
      'https://linkedin.com/company/scamshield',
      'https://github.com/scamshield'
    ]
  }
};

// SEO Service Class
export class SEOService {
  private config: SEOConfig;
  private currentPageSEO: PageSEO | null = null;

  constructor(config: Partial<SEOConfig> = {}) {
    this.config = { ...DEFAULT_SEO_CONFIG, ...config };
    this.initializeBaseSEO();
  }

  private initializeBaseSEO() {
    // Set initial meta tags
    this.setTitle(this.config.defaultTitle);
    this.setMetaDescription(this.config.defaultDescription);
    this.setMetaKeywords(this.config.defaultKeywords);
    this.setCanonicalUrl(this.config.siteUrl);
    
    // Set Open Graph tags
    this.setOpenGraphTags({
      title: this.config.defaultTitle,
      description: this.config.defaultDescription,
      image: this.config.defaultImage,
      url: this.config.siteUrl,
      type: 'website'
    });
    
    // Set Twitter Card tags
    this.setTwitterCardTags({
      title: this.config.defaultTitle,
      description: this.config.defaultDescription,
      image: this.config.defaultImage,
      card: 'summary_large_image'
    });
    
    // Set language and alternate languages
    this.setLanguageTags();
    
    // Add organization structured data
    this.addStructuredData('Organization', this.generateOrganizationSchema());
  }

  // Update page SEO
  updatePageSEO(pageSEO: PageSEO) {
    this.currentPageSEO = pageSEO;
    
    // Update title
    const fullTitle = `${pageSEO.title} | ${this.config.siteName}`;
    this.setTitle(fullTitle);
    
    // Update meta description
    this.setMetaDescription(pageSEO.description);
    
    // Update keywords if provided
    if (pageSEO.keywords) {
      this.setMetaKeywords([...this.config.defaultKeywords, ...pageSEO.keywords]);
    }
    
    // Update canonical URL
    if (pageSEO.canonicalUrl) {
      this.setCanonicalUrl(pageSEO.canonicalUrl);
    }
    
    // Update robots meta
    this.setRobotsMeta(pageSEO.noIndex, pageSEO.noFollow);
    
    // Update Open Graph
    this.setOpenGraphTags({
      title: fullTitle,
      description: pageSEO.description,
      image: pageSEO.ogImage || this.config.defaultImage,
      url: pageSEO.canonicalUrl || window.location.href,
      type: pageSEO.ogType || 'article'
    });
    
    // Update Twitter Card
    this.setTwitterCardTags({
      title: fullTitle,
      description: pageSEO.description,
      image: pageSEO.ogImage || this.config.defaultImage,
      card: 'summary_large_image'
    });
    
    // Add structured data
    if (pageSEO.structuredData) {
      pageSEO.structuredData.forEach(data => {
        this.addStructuredData(data.type, data.data);
      });
    }
    
    // Add breadcrumbs
    if (pageSEO.breadcrumbs) {
      this.addBreadcrumbsStructuredData(pageSEO.breadcrumbs);
    }
    
    logger.info('Page SEO updated', { title: pageSEO.title, url: pageSEO.canonicalUrl });
  }

  private setTitle(title: string) {
    document.title = title;
    
    // Also update og:title and twitter:title
    this.setMetaProperty('og:title', title);
    this.setMetaProperty('twitter:title', title);
  }

  private setMetaDescription(description: string) {
    this.setMetaTag('description', description);
    this.setMetaProperty('og:description', description);
    this.setMetaProperty('twitter:description', description);
  }

  private setMetaKeywords(keywords: string[]) {
    this.setMetaTag('keywords', keywords.join(', '));
  }

  private setCanonicalUrl(url: string) {
    const existing = document.querySelector('link[rel="canonical"]');
    if (existing) {
      existing.setAttribute('href', url);
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = url;
      document.head.appendChild(link);
    }
    
    this.setMetaProperty('og:url', url);
    this.setMetaProperty('twitter:url', url);
  }

  private setRobotsMeta(noIndex?: boolean, noFollow?: boolean) {
    const directives: string[] = [];
    
    if (noIndex) directives.push('noindex');
    else directives.push('index');
    
    if (noFollow) directives.push('nofollow');
    else directives.push('follow');
    
    // Add additional directives
    directives.push('max-snippet:-1');
    directives.push('max-image-preview:large');
    directives.push('max-video-preview:-1');
    
    this.setMetaTag('robots', directives.join(', '));
  }

  private setOpenGraphTags(og: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
  }) {
    this.setMetaProperty('og:title', og.title);
    this.setMetaProperty('og:description', og.description);
    this.setMetaProperty('og:image', og.image);
    this.setMetaProperty('og:url', og.url);
    this.setMetaProperty('og:type', og.type);
    this.setMetaProperty('og:site_name', this.config.siteName);
    
    // Add image dimensions for better display
    this.setMetaProperty('og:image:width', '1200');
    this.setMetaProperty('og:image:height', '630');
    this.setMetaProperty('og:image:alt', og.title);
    
    // Add Facebook App ID if available
    if (this.config.facebookAppId) {
      this.setMetaProperty('fb:app_id', this.config.facebookAppId);
    }
  }

  private setTwitterCardTags(twitter: {
    title: string;
    description: string;
    image: string;
    card: string;
  }) {
    this.setMetaProperty('twitter:card', twitter.card);
    this.setMetaProperty('twitter:title', twitter.title);
    this.setMetaProperty('twitter:description', twitter.description);
    this.setMetaProperty('twitter:image', twitter.image);
    this.setMetaProperty('twitter:site', this.config.twitterHandle);
    this.setMetaProperty('twitter:creator', this.config.twitterHandle);
  }

  private setLanguageTags() {
    // Set HTML lang attribute
    document.documentElement.lang = this.config.defaultLanguage;
    
    // Add hreflang links for supported languages
    this.config.supportedLanguages.forEach(lang => {
      const existing = document.querySelector(`link[hreflang="${lang}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        link.href = `${this.config.siteUrl}/${lang === 'en' ? '' : lang}`;
        document.head.appendChild(link);
      }
    });
    
    // Add x-default hreflang
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = this.config.siteUrl;
    document.head.appendChild(defaultLink);
  }

  private setMetaTag(name: string, content: string) {
    const existing = document.querySelector(`meta[name="${name}"]`);
    if (existing) {
      existing.setAttribute('content', content);
    } else {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  }

  private setMetaProperty(property: string, content: string) {
    const existing = document.querySelector(`meta[property="${property}"]`);
    if (existing) {
      existing.setAttribute('content', content);
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.content = content;
      document.head.appendChild(meta);
    }
  }

  // Structured Data Methods
  addStructuredData(type: string, data: any) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };

    const scriptId = `structured-data-${type.toLowerCase()}`;
    const existing = document.getElementById(scriptId);
    
    if (existing) {
      existing.textContent = JSON.stringify(structuredData);
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }

  private generateOrganizationSchema() {
    return {
      name: this.config.organizationSchema.name,
      url: this.config.organizationSchema.url,
      logo: this.config.organizationSchema.logo,
      description: this.config.organizationSchema.description,
      address: {
        '@type': 'PostalAddress',
        ...this.config.organizationSchema.address
      },
      contactPoint: {
        '@type': 'ContactPoint',
        ...this.config.organizationSchema.contactPoint
      },
      sameAs: this.config.organizationSchema.sameAs
    };
  }

  addBreadcrumbsStructuredData(breadcrumbs: Breadcrumb[]) {
    const breadcrumbList = {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };

    this.addStructuredData('BreadcrumbList', breadcrumbList);
  }

  // Article structured data
  addArticleStructuredData(article: {
    title: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    image?: string;
  }) {
    const articleData = {
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      author: {
        '@type': 'Person',
        name: article.author
      },
      publisher: {
        '@type': 'Organization',
        name: this.config.organizationSchema.name,
        logo: {
          '@type': 'ImageObject',
          url: this.config.organizationSchema.logo
        }
      },
      datePublished: article.datePublished,
      dateModified: article.dateModified || article.datePublished,
      image: article.image || this.config.defaultImage,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': window.location.href
      }
    };

    this.addStructuredData('Article', articleData);
  }

  // FAQ structured data
  addFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
    const faqData = {
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };

    this.addStructuredData('FAQPage', faqData);
  }

  // Local Business structured data (if applicable)
  addLocalBusinessStructuredData(business: {
    name: string;
    description: string;
    telephone: string;
    address: any;
    openingHours: string[];
    priceRange?: string;
  }) {
    const businessData = {
      '@type': 'LocalBusiness',
      ...business,
      address: {
        '@type': 'PostalAddress',
        ...business.address
      }
    };

    this.addStructuredData('LocalBusiness', businessData);
  }

  // Product structured data
  addProductStructuredData(product: {
    name: string;
    description: string;
    image: string;
    brand: string;
    offers: {
      price: string;
      currency: string;
      availability: string;
    };
    aggregateRating?: {
      ratingValue: number;
      reviewCount: number;
    };
  }) {
    const productData = {
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      brand: {
        '@type': 'Brand',
        name: product.brand
      },
      offers: {
        '@type': 'Offer',
        ...product.offers
      }
    };

    if (product.aggregateRating) {
      productData.aggregateRating = {
        '@type': 'AggregateRating',
        ...product.aggregateRating
      };
    }

    this.addStructuredData('Product', productData);
  }

  // Utility Methods
  generateSitemap(): string {
    // This would generate an XML sitemap
    // In a real implementation, this would be more comprehensive
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${this.config.siteUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  }

  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

Sitemap: ${this.config.siteUrl}/sitemap.xml

# Block sensitive areas
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /.env
Disallow: /config/

# Allow specific files
Allow: /api/sitemap
Allow: /api/rss

# Crawl delay
Crawl-delay: 1`;
  }

  // Performance and Core Web Vitals optimization
  preloadCriticalResources(resources: string[]) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      // Determine resource type
      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
        link.as = 'image';
      } else if (resource.match(/\.(woff|woff2|ttf|otf)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  }

  preconnectToDomains(domains: string[]) {
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  // Social Media Meta Tags
  addSocialMediaTags(social: {
    twitterSite?: string;
    twitterCreator?: string;
    facebookAppId?: string;
    linkedinCompanyId?: string;
  }) {
    if (social.twitterSite) {
      this.setMetaProperty('twitter:site', social.twitterSite);
    }
    
    if (social.twitterCreator) {
      this.setMetaProperty('twitter:creator', social.twitterCreator);
    }
    
    if (social.facebookAppId) {
      this.setMetaProperty('fb:app_id', social.facebookAppId);
    }
  }

  // Clean up old structured data
  cleanupStructuredData() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
      if (script.id.startsWith('structured-data-')) {
        script.remove();
      }
    });
  }

  // Get current SEO status
  getSEOStatus() {
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
      structuredData: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(script => {
        try {
          return JSON.parse(script.textContent || '{}');
        } catch {
          return {};
        }
      })
    };
  }
}

// Export singleton instance
export const seoService = new SEOService();

// React hook for SEO
export function useSEO(pageSEO?: PageSEO) {
  React.useEffect(() => {
    if (pageSEO) {
      seoService.updatePageSEO(pageSEO);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [pageSEO]);

  return {
    updateSEO: (newPageSEO: PageSEO) => seoService.updatePageSEO(newPageSEO),
    addStructuredData: (type: string, data: any) => seoService.addStructuredData(type, data),
    getSEOStatus: () => seoService.getSEOStatus()
  };
}

export default seoService;