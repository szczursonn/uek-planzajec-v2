import type { AvailableLanguageTag } from '$lib/paraglide/runtime';
import type { ParaglideLocals } from '@inlang/paraglide-sveltekit';

declare global {
    namespace App {
        interface Locals {
            paraglide: ParaglideLocals<AvailableLanguageTag>;
        }
        interface Platform {
            context: {
                waitUntil(promise: Promise<unknown>): void;
            };
            caches: CacheStorage & { default: Cache };
        }
    }
}

export {};
