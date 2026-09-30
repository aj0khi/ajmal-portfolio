import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    order: z.number().int().positive(),
    title: z.string(),
    status: z.enum(['ACTIVE', 'IN PROGRESS', 'SHIPPED']),
    stack: z.string(),
    summary: z.string(),
    contribution: z.string().optional(),
    problem: z.string().optional(),
    system: z.string().optional(),
    decision: z.string().optional(),
    next: z.string().optional(),
    link: z.url().optional(),
    linkLabel: z.string().optional()
  })
});

export const collections = { projects };