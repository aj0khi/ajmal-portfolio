import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
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
    link: z.string().url().optional(),
    linkLabel: z.string().optional()
  })
});

export const collections = { projects };