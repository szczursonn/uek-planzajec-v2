import { writable } from 'svelte/store';

const DEFAULT_TIME = 5_000;

export const createSnackbarStore = () => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const { subscribe, set } = writable(
        null as {
            message: string;
        } | null
    );

    const cleanup = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        set(null);
    };

    return {
        subscribe,
        show({ message, time = DEFAULT_TIME }: { message: string; time?: number }) {
            set({ message });
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(cleanup, time);
        },
        hide() {
            cleanup();
        },
        cleanup
    };
};
