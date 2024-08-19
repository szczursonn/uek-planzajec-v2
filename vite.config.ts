import { defineConfig } from 'vite';
import { paraglide } from '@inlang/paraglide-sveltekit/vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
    plugins: [
        paraglide({
            project: './project.inlang',
            outdir: './src/lib/paraglide'
        }),
        sveltekit()
    ]
});
