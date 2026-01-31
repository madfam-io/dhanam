import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/demo', '/es', '/en', '/pt-BR'],
        disallow: ['/dashboard/', '/settings/', '/api/', '/admin/'],
      },
    ],
    sitemap: 'https://dhan.am/sitemap.xml',
  };
}
