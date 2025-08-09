// XML Sitemap Generation Service
import { logger } from './logger';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{
    hreflang: string;
    href: string;
  }>;
}

export interface SitemapConfig {
  baseUrl: string;
  defaultChangefreq: SitemapUrl['changefreq'];
  defaultPriority: number;
  supportedLanguages: string[];
}

export class SitemapGenerator {
  private config: SitemapConfig;
  private urls: Map<string, SitemapUrl>;

  constructor(config: SitemapConfig) {
    // Initialize Map in constructor to avoid module-level execution
    this.urls = new Map();
    this.config = config;
    this.initializeDefaultUrls();
  }

  private initializeDefaultUrls() {
    // Add default application URLs
    this.addUrl({
      loc: this.config.baseUrl,
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString()
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/dashboard`,
      changefreq: 'daily',
      priority: 0.9
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/scan`,
      changefreq: 'weekly',
      priority: 0.8
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/alerts`,
      changefreq: 'hourly',
      priority: 0.8
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/analytics`,
      changefreq: 'daily',
      priority: 0.7
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/settings`,
      changefreq: 'monthly',
      priority: 0.6
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/help`,
      changefreq: 'weekly',
      priority: 0.7
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/about`,
      changefreq: 'monthly',
      priority: 0.5
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/privacy`,
      changefreq: 'yearly',
      priority: 0.4
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/terms`,
      changefreq: 'yearly',
      priority: 0.4
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/security`,
      changefreq: 'monthly',
      priority: 0.6
    });

    // Add blog/resources URLs
    this.addUrl({
      loc: `${this.config.baseUrl}/blog`,
      changefreq: 'daily',
      priority: 0.8
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/resources`,
      changefreq: 'weekly',
      priority: 0.7
    });

    this.addUrl({
      loc: `${this.config.baseUrl}/guides`,
      changefreq: 'weekly',
      priority: 0.7
    });

    // Add API documentation
    this.addUrl({
      loc: `${this.config.baseUrl}/api/docs`,
      changefreq: 'weekly',
      priority: 0.6
    });
  }

  addUrl(url: SitemapUrl) {
    // Add language alternates if not already present
    if (this.config.supportedLanguages.length > 1 && !url.alternates) {
      url.alternates = this.config.supportedLanguages.map(lang => ({
        hreflang: lang,
        href: lang === 'en' ? url.loc : `${url.loc}/${lang}`
      }));
      
      // Add x-default
      url.alternates.push({
        hreflang: 'x-default',
        href: url.loc
      });
    }

    this.urls.set(url.loc, {
      ...url,
      changefreq: url.changefreq || this.config.defaultChangefreq,
      priority: url.priority ?? this.config.defaultPriority,
      lastmod: url.lastmod || new Date().toISOString().split('T')[0]
    });

    logger.debug(`Added URL to sitemap: ${url.loc}`);
  }

  removeUrl(loc: string) {
    this.urls.delete(loc);
    logger.debug(`Removed URL from sitemap: ${loc}`);
  }

  addBlogPosts(posts: Array<{
    slug: string;
    lastModified: Date;
    priority?: number;
  }>) {
    posts.forEach(post => {
      this.addUrl({
        loc: `${this.config.baseUrl}/blog/${post.slug}`,
        lastmod: post.lastModified.toISOString(),
        changefreq: 'monthly',
        priority: post.priority || 0.6
      });
    });
  }

  addGuides(guides: Array<{
    slug: string;
    category: string;
    lastModified: Date;
    priority?: number;
  }>) {
    guides.forEach(guide => {
      this.addUrl({
        loc: `${this.config.baseUrl}/guides/${guide.category}/${guide.slug}`,
        lastmod: guide.lastModified.toISOString(),
        changefreq: 'monthly',
        priority: guide.priority || 0.7
      });
    });
  }

  addResources(resources: Array<{
    slug: string;
    type: string;
    lastModified: Date;
    priority?: number;
  }>) {
    resources.forEach(resource => {
      this.addUrl({
        loc: `${this.config.baseUrl}/resources/${resource.type}/${resource.slug}`,
        lastmod: resource.lastModified.toISOString(),
        changefreq: 'monthly',
        priority: resource.priority || 0.6
      });
    });
  }

  generateXML(): string {
    const urls = Array.from(this.urls.values())
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    urls.forEach(url => {
      xml += `
  <url>
    <loc>${this.escapeXml(url.loc)}</loc>`;
      
      if (url.lastmod) {
        xml += `
    <lastmod>${url.lastmod}</lastmod>`;
      }
      
      if (url.changefreq) {
        xml += `
    <changefreq>${url.changefreq}</changefreq>`;
      }
      
      if (url.priority !== undefined) {
        xml += `
    <priority>${url.priority.toFixed(1)}</priority>`;
      }

      // Add language alternates
      if (url.alternates) {
        url.alternates.forEach(alt => {
          xml += `
    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${this.escapeXml(alt.href)}" />`;
        });
      }

      xml += `
  </url>`;
    });

    xml += `
</urlset>`;

    return xml;
  }

  generateSitemapIndex(sitemaps: Array<{
    loc: string;
    lastmod?: string;
  }>): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    sitemaps.forEach(sitemap => {
      xml += `
  <sitemap>
    <loc>${this.escapeXml(sitemap.loc)}</loc>`;
      
      if (sitemap.lastmod) {
        xml += `
    <lastmod>${sitemap.lastmod}</lastmod>`;
      }
      
      xml += `
  </sitemap>`;
    });

    xml += `
</sitemapindex>`;

    return xml;
  }

  generateRobotsTxt(additionalRules?: string): string {
    const sitemapUrl = `${this.config.baseUrl}/sitemap.xml`;
    
    let robots = `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${sitemapUrl}

# Block admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /.env
Disallow: /config/
Disallow: /logs/

# Allow specific API endpoints
Allow: /api/sitemap
Allow: /api/rss
Allow: /api/health

# Block sensitive files
Disallow: /*.json$
Disallow: /*.xml$
Disallow: /*.txt$
Disallow: /*.log$

# Crawl delay
Crawl-delay: 1

# Cache policy
Cache-delay: 86400`;

    if (additionalRules) {
      robots += `\n\n# Additional rules\n${additionalRules}`;
    }

    return robots;
  }

  // Generate news sitemap for timely content
  generateNewsSitemap(articles: Array<{
    loc: string;
    title: string;
    publishDate: Date;
    language?: string;
  }>): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

    articles.forEach(article => {
      xml += `
  <url>
    <loc>${this.escapeXml(article.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>ScamShield</news:name>
        <news:language>${article.language || 'en'}</news:language>
      </news:publication>
      <news:publication_date>${article.publishDate.toISOString()}</news:publication_date>
      <news:title>${this.escapeXml(article.title)}</news:title>
    </news:news>
  </url>`;
    });

    xml += `
</urlset>`;

    return xml;
  }

  // Generate image sitemap
  generateImageSitemap(images: Array<{
    pageUrl: string;
    imageUrl: string;
    caption?: string;
    title?: string;
    geoLocation?: string;
    license?: string;
  }>): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    // Group images by page
    const imagesByPage = new Map<string, typeof images>();
    images.forEach(image => {
      if (!imagesByPage.has(image.pageUrl)) {
        imagesByPage.set(image.pageUrl, []);
      }
      imagesByPage.get(image.pageUrl)!.push(image);
    });

    imagesByPage.forEach((pageImages, pageUrl) => {
      xml += `
  <url>
    <loc>${this.escapeXml(pageUrl)}</loc>`;

      pageImages.forEach(image => {
        xml += `
    <image:image>
      <image:loc>${this.escapeXml(image.imageUrl)}</image:loc>`;
        
        if (image.caption) {
          xml += `
      <image:caption>${this.escapeXml(image.caption)}</image:caption>`;
        }
        
        if (image.title) {
          xml += `
      <image:title>${this.escapeXml(image.title)}</image:title>`;
        }
        
        if (image.geoLocation) {
          xml += `
      <image:geo_location>${this.escapeXml(image.geoLocation)}</image:geo_location>`;
        }
        
        if (image.license) {
          xml += `
      <image:license>${this.escapeXml(image.license)}</image:license>`;
        }
        
        xml += `
    </image:image>`;
      });

      xml += `
  </url>`;
    });

    xml += `
</urlset>`;

    return xml;
  }

  // Generate video sitemap
  generateVideoSitemap(videos: Array<{
    pageUrl: string;
    videoUrl: string;
    thumbnailUrl: string;
    title: string;
    description: string;
    duration?: number;
    publishDate?: Date;
    rating?: number;
    viewCount?: number;
    familyFriendly?: boolean;
  }>): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

    // Group videos by page
    const videosByPage = new Map<string, typeof videos>();
    videos.forEach(video => {
      if (!videosByPage.has(video.pageUrl)) {
        videosByPage.set(video.pageUrl, []);
      }
      videosByPage.get(video.pageUrl)!.push(video);
    });

    videosByPage.forEach((pageVideos, pageUrl) => {
      xml += `
  <url>
    <loc>${this.escapeXml(pageUrl)}</loc>`;

      pageVideos.forEach(video => {
        xml += `
    <video:video>
      <video:thumbnail_loc>${this.escapeXml(video.thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${this.escapeXml(video.title)}</video:title>
      <video:description>${this.escapeXml(video.description)}</video:description>
      <video:content_loc>${this.escapeXml(video.videoUrl)}</video:content_loc>`;
        
        if (video.duration) {
          xml += `
      <video:duration>${video.duration}</video:duration>`;
        }
        
        if (video.publishDate) {
          xml += `
      <video:publication_date>${video.publishDate.toISOString()}</video:publication_date>`;
        }
        
        if (video.rating !== undefined) {
          xml += `
      <video:rating>${video.rating}</video:rating>`;
        }
        
        if (video.viewCount) {
          xml += `
      <video:view_count>${video.viewCount}</video:view_count>`;
        }
        
        if (video.familyFriendly !== undefined) {
          xml += `
      <video:family_friendly>${video.familyFriendly ? 'yes' : 'no'}</video:family_friendly>`;
        }
        
        xml += `
    </video:video>`;
      });

      xml += `
  </url>`;
    });

    xml += `
</urlset>`;

    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  getStats() {
    const urls = Array.from(this.urls.values());
    const priorityGroups = {
      high: urls.filter(u => (u.priority || 0) >= 0.8).length,
      medium: urls.filter(u => (u.priority || 0) >= 0.5 && (u.priority || 0) < 0.8).length,
      low: urls.filter(u => (u.priority || 0) < 0.5).length
    };

    const changeFreqGroups = urls.reduce((acc, url) => {
      const freq = url.changefreq || 'monthly';
      acc[freq] = (acc[freq] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUrls: urls.length,
      priorityDistribution: priorityGroups,
      changeFrequencyDistribution: changeFreqGroups,
      lastGenerated: new Date().toISOString()
    };
  }
}

// Create default instance
export const sitemapGenerator = new SitemapGenerator({
  baseUrl: 'https://www.scamshiel.com',
  defaultChangefreq: 'weekly',
  defaultPriority: 0.5,
  supportedLanguages: ['en', 'es', 'fr', 'de']
});

export default sitemapGenerator;