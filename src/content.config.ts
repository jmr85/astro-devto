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
	loader: {
        name: 'devto',
        load: async ({ store, logger, meta }) => {
                // Retrieve last modified date from meta
                const lastModified = meta.get('last-modified');
                const headers = new Headers({
                    "api-key": DEV_API_KEY,
                });
                if (lastModified) {
                    headers.set("If-Modified-Since", lastModified);
                }
        
                const res = await fetch(`${DEV_TO_API_URL}articles?username=jmr85`, {
                    headers: headers,
                });
        
                // Handle cases where the content has not been modified
                if (res.status === 304) {
                    logger.info("Dev.to feed not modified, skipping update.");
                    return;
                }
        
                if (!res.ok) {
                    throw new Error(`Failed to fetch dev.to articles: ${res.statusText}`);
                }
        
                // Store the last modified date for future requests
                const newLastModified = res.headers.get('last-modified');
                if (newLastModified) {
                    meta.set('last-modified', newLastModified);
                }
        
                const posts = await res.json();
        
                // Clear the store to handle updates cleanly
                store.clear();
        
                // Map posts to the store with the required schema
                for (const post of posts) {
                    const data = {
                        id: post.slug,
                        title: post.title,
                        description: post.description,
                        pubDate: new Date(post.published_at),
                        updatedDate: post.edited_at ? new Date(post.edited_at) : null,
                        heroImage: post.cover_image || post.social_image,
                        url: post.url,
                    };
        
                    store.set({
                        id: post.slug,
                        data
                    });
                }
            },
    },
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().nullable(),
		url: z.string(),
    }),
  });

export const collections = { blog, devTo };
