import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import nodeAdapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: nodeAdapter()
    }
};

export default config;
