import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import cloudflareAdapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: cloudflareAdapter(),
        prerender: {
            origin: 'https://uek-planzajec-v2.pages.dev'
        }
    }
};

export default config;
