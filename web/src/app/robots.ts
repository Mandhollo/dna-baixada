import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api', '/entrar', '/cadastro', '/recuperar-senha', '/redefinir-senha'],
      },
    ],
    sitemap: 'https://dna-baixada.vercel.app/sitemap.xml',
  };
}
