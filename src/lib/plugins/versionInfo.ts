import type { PluginOption } from 'vite';
import { exec } from 'node:child_process';

const getCurrentGitCommitHash = (rootDirPath: string) =>
    new Promise<string | null>((resolve) => {
        exec('git rev-parse --short HEAD', { cwd: rootDirPath }, (err, output) => {
            if (err) {
                console.error('failed to get current git commit hash', err);
                resolve(null);
            }
            resolve(output.trim());
        });
    });

const virtualModuleId = 'virtual:version-info';
const resolvedVirtualModuleId = '\0' + virtualModuleId;

export const versionInfoPlugin = (rootDirPath: string): PluginOption => {
    return {
        name: 'embed-version-info',
        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
        },
        async load(id) {
            if (id === resolvedVirtualModuleId) {
                const gitHash = await getCurrentGitCommitHash(rootDirPath);
                return `export const gitHash = ${JSON.stringify(gitHash)};`;
            }
        }
    };
};
