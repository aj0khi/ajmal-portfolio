import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  // The journey used to live at /journey/ and the old desktop at /os; both now land on the homepage.
  redirects: {
    '/journey': '/',
    '/os': '/'
  }
});
