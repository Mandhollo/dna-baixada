import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://dna-baixada.vercel.app';
  const lastModified = new Date();

  // Páginas públicas principais
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/turismo`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/turismo/cruzeiros`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/turismo/booking`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/turismo/eventos`, lastModified, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/parceiros`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/social`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/social/ranking`, lastModified, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/recompensas`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/sobre`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contato`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/ajuda`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/termos`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacidade`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return staticPages;
}
