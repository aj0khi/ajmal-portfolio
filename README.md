# Ajmal Khidri - Build Log

Personal portfolio built with Astro, TypeScript, semantic HTML, CSS, and small client-side scripts.

## Local development

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

## Production build

```bash
npm run check
npm run build
```

The deployable static site is generated in `dist/`.

The original WayBionic arm video was compressed to `public/assets/waybionic/arm-demo.mp4` for web delivery and remains under GitHub's file limit. The Media Player keeps the Drive fallback available.

## Hosting

Upload the contents of `dist/` to a static host such as Hostinger. The main site is static, while `public/proxy.php` is an optional Hostinger PHP endpoint used by the in-app browser for destinations that block iframe embedding. Keep it behind HTTPS and do not use it for private URLs or authenticated browsing.

## Content

Project entries live in `src/content/projects/`. Add a new Markdown file using the schema in `src/content.config.ts`.