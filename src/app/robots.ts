import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/console/', '/projects/', '/catalog/', '/check-in/', '/(portal)/'],
    },
    sitemap: 'https://gvteway.com/sitemap.xml',
  };
}
