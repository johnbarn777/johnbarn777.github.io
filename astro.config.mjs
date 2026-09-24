// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://johnbarn777.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // /writing stays out of the index until it has posts (decision D8).
      filter: (page) => !page.includes('/writing'),
    }),
  ],
  // Prefetch internal pages on hover so page-to-page navigation feels instant.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
