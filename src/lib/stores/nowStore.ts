import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// TODO: update at the beginning of each minute instead

export const createNowStore = (initialNow: Date) => {
    const { subscribe, set } = writable(initialNow);

    let timeout: ReturnType<typeof setTimeout> | null = null;

    const updateNow = () => {
        set(new Date());
    };

    const stopTimeout = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    const startTimeout = () => {
        stopTimeout();

        const now = new Date();
        setTimeout(
            () => {
                updateNow();
                startTimeout();
            },
            60_000 - now.getSeconds() * 1000 - now.getMilliseconds()
        );
    };

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            updateNow();
            startTimeout();
        } else {
            stopTimeout();
        }
    };

    if (browser) {
        startTimeout();
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return {
        subscribe,
        cleanup() {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            stopTimeout();
        }
    };
};
