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

## Hosting

Upload the contents of `dist/` to a static host such as Hostinger. The site does not require a Node.js server at runtime.

## Content

Project entries live in `src/content/projects/`. Add a new Markdown file using the schema in `src/content.config.ts`.