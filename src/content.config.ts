import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';
const { DEV_API_KEY, DEV_TO_API_URL } = import.meta.env;

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
	}),
});

const devTo = defineCollection({
	loader: async () => {
        const headers = new Headers({
            "api-key": DEV_API_KEY,
        });
        const posts = await fetch(`${DEV_TO_API_URL}articles/me/published`, {
            headers: headers
        }).then(res => res.json());
        
        return posts.map((post: any) => ({
			id: post.slug,
            title: post.title,
            description: post.description,
            pubDate: new Date(post.published_at),
            updatedDate: post.edited_at,
            heroImage: post.cover_image || post.social_image,
			url: post.url,
            content: post.body_markdown,
        }));
    },
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().optional(),
		url: z.string(),
        content: z.string(),
    }),
  });

export const collections = { blog, devTo };
