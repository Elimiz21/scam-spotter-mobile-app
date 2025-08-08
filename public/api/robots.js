// Dynamic Robots.txt Generation API
import { sitemapGenerator } from '../../src/lib/sitemap.js';

export default async function handler(req, res) {
  try {
    // Set appropriate headers for robots.txt
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Generate robots.txt content
    const robotsTxt = generateRobotsTxt();
    
    res.status(200).send(robotsTxt);
    
  } catch (error) {
    console.error('Robots.txt generation failed:', error);
    
    // Return basic robots.txt on error
    const basicRobots = `User-agent: *
Allow: /

Sitemap: https://www.scamshiel.com/sitemap.xml`;

    res.status(200).send(basicRobots);
  }
}

function generateRobotsTxt() {
  const additionalRules = `
# Specific bot configurations
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

# Block specific paths for security
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /.env
Disallow: /config/
Disallow: /logs/
Disallow: /temp/
Disallow: /backup/
Disallow: /*?debug=*
Disallow: /*?test=*
Disallow: /*?admin=*

# Block sensitive file types
Disallow: /*.json$
Disallow: /*.xml$ 
Disallow: /*.log$
Disallow: /*.sql$
Disallow: /*.bak$
Disallow: /*.tmp$

# Performance optimization
Crawl-delay: 1

# Cache policy for crawlers  
Cache-delay: 86400`;

  // Use the sitemap generator to create robots.txt
  return sitemapGenerator.generateRobotsTxt(additionalRules);
}