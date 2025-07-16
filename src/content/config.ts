import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    image: z.string(),
    tech: z.array(z.string()),
    demo: z.string().url().optional(),
    repo: z.string().url().optional(),
  }),
});

export const collections = { projects };
