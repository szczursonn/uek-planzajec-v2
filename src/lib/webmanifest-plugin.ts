import type { PluginOption } from 'vite';
import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';

const staticDirPath = path.resolve(__dirname, '../../static');
const messagesDirPath = path.resolve(__dirname, '../../messages');

// Importing from ./paraglide causes vite dev server to explode, so must do this shit
// an API route the serves the manifest would be 100x better but a vite plugin is cooler
const getWebManifest = async (languageTag: string) => {
    const buff = await fs.readFile(path.resolve(messagesDirPath, `${languageTag}.json`));
    const messages = z
        .object({
            appTitle: z.string(),
            metaPageDescriptionPicker: z.string()
        })
        .parse(JSON.parse(buff.toString('utf-8')));

    return JSON.stringify({
        name: messages.appTitle,
        short_name: messages.appTitle,
        description: messages.metaPageDescriptionPicker,
        start_url: '/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#3b82f6',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ]
    });
};

export const webManifestPlugin = (): PluginOption => {
    return {
        name: 'generate-webmanifests',
        async buildEnd() {
            try {
                if (!(await fs.stat(staticDirPath)).isDirectory()) {
                    throw new Error(`${staticDirPath} is not a directory`);
                }
            } catch (err) {
                if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
                    await fs.mkdir(staticDirPath, { recursive: true });
                } else {
                    throw err;
                }
            }

            const fileNames = await fs.readdir(messagesDirPath);

            await Promise.all(
                fileNames.map(async (fileName) => {
                    const languageTag = fileName.split('.')[0];
                    if (!fileName.endsWith('.json') || languageTag?.length !== 2) {
                        return;
                    }

                    await fs.writeFile(
                        path.resolve(staticDirPath, `manifest-${languageTag}.webmanifest`),
                        await getWebManifest(languageTag),
                        'utf-8'
                    );
                })
            );
        },
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const languageTag = req.url?.match(/\/manifest-(\w{2})\.webmanifest/)?.[1];
                if (!languageTag) {
                    next();
                    return;
                }

                try {
                    const webmanifestJSON = await getWebManifest(languageTag);

                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    res.end(webmanifestJSON);
                } catch (err) {
                    console.error('[webmanifest-plugin]', err);
                    res.writeHead(500);
                } finally {
                    res.end();
                }
            });
        }
    };
};
