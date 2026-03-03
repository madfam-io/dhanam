import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/demo', '/es', '/en', '/pt-BR', '/privacy', '/terms', '/security', '/cookies', '/esg'],
        disallow: ['/dashboard/', '/settings/', '/api/', '/admin/'],
      },
    ],
    sitemap: 'https://dhan.am/sitemap.xml',
  };
}
