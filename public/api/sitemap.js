// Dynamic Sitemap Generation API
import { sitemapGenerator } from '../../src/lib/sitemap.js';

export default async function handler(req, res) {
  try {
    // Set appropriate headers for XML sitemap
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Add dynamic content to sitemap
    await addDynamicContent();
    
    // Generate XML sitemap
    const xmlSitemap = sitemapGenerator.generateXML();
    
    res.status(200).send(xmlSitemap);
    
  } catch (error) {
    console.error('Sitemap generation failed:', error);
    
    // Return basic sitemap on error
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.scamshiel.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://www.scamshiel.com/dashboard</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://www.scamshiel.com/scan</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>
</urlset>`;

    res.status(200).send(basicSitemap);
  }
}

async function addDynamicContent() {
  try {
    // Add blog posts if available
    const blogPosts = await getBlogPosts();
    if (blogPosts.length > 0) {
      sitemapGenerator.addBlogPosts(blogPosts);
    }
    
    // Add resource pages if available
    const resources = await getResourcePages();
    if (resources.length > 0) {
      sitemapGenerator.addResources(resources);
    }
    
    // Add help/guide pages if available
    const guides = await getGuidePages();
    if (guides.length > 0) {
      sitemapGenerator.addGuides(guides);
    }
    
  } catch (error) {
    console.warn('Failed to add dynamic content to sitemap:', error);
  }
}

async function getBlogPosts() {
  // Mock blog posts - replace with actual data source
  return [
    {
      slug: 'how-to-identify-phishing-emails',
      lastModified: new Date('2024-01-15'),
      priority: 0.8
    },
    {
      slug: 'common-online-scams-2024',
      lastModified: new Date('2024-01-10'),
      priority: 0.7
    },
    {
      slug: 'protecting-yourself-from-romance-scams',
      lastModified: new Date('2024-01-05'),
      priority: 0.7
    }
  ];
}

async function getResourcePages() {
  // Mock resources - replace with actual data source
  return [
    {
      slug: 'scam-prevention-checklist',
      type: 'checklist',
      lastModified: new Date('2024-01-12'),
      priority: 0.8
    },
    {
      slug: 'reporting-scams-guide',
      type: 'guide',
      lastModified: new Date('2024-01-08'),
      priority: 0.7
    }
  ];
}

async function getGuidePages() {
  // Mock guides - replace with actual data source
  return [
    {
      slug: 'email-security-best-practices',
      category: 'email-security',
      lastModified: new Date('2024-01-14'),
      priority: 0.8
    },
    {
      slug: 'social-media-safety-tips',
      category: 'social-media',
      lastModified: new Date('2024-01-11'),
      priority: 0.7
    }
  ];
}