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

const experience = defineCollection({
  type: 'content',
  schema: z.object({
    year: z.number(),
    title: z.string(),
    description: z.string(),
    achievements: z.array(z.string()).optional(),
    tech: z.array(z.string()).optional(),
    links: z
      .array(
        z.object({
          text: z.string(),
          href: z.string().url(),
        })
      )
      .optional(),
  }),
});

export const collections = { projects, experience };
