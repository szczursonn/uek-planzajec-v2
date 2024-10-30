import { defineConfig } from 'vite';
import { paraglide } from '@inlang/paraglide-sveltekit/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { webManifestPlugin } from './src/lib/plugins/webManifest';
import { versionInfoPlugin } from './src/lib/plugins/versionInfo';

export default defineConfig({
    plugins: [
        paraglide({
            project: './project.inlang',
            outdir: './src/lib/paraglide'
        }),
        webManifestPlugin(__dirname),
        versionInfoPlugin(__dirname),
        sveltekit()
    ]
});
