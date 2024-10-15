import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import { serialize as serializeCookie } from 'cookie';
import { browser } from '$app/environment';
import type { FavoriteSchedule, ScheduleType, ScheduleView } from '$lib/types';
import { COOKIE, MAX_COOKIE_AGE } from '$lib/consts';

type GlobalContext = {
    now: ReturnType<typeof createNowStore>;
    favoriteSchedules: ReturnType<typeof createFavoriteSchedulesStore>;
};

const getGlobalContext = () => getContext<GlobalContext>('global');
export const initializeGlobalContext = ({
    now,
    favoriteSchedules
}: {
    now: Date;
    favoriteSchedules: FavoriteSchedule[];
}) =>
    setContext<GlobalContext>('global', {
        now: createNowStore(now),
        favoriteSchedules: createFavoriteSchedulesStore(favoriteSchedules)
    });

// TODO: update at the beginning of each minute instead
const NOW_UPDATE_INTERVAL = 1000 * 60; // 60s
const createNowStore = (initialNow: Date) => {
    const { subscribe, set } = writable(initialNow);

    if (browser) {
        let interval: ReturnType<typeof setInterval> | undefined;

        const updateNow = () => {
            set(new Date());
        };
        const startInterval = () => {
            if (!interval) {
                interval = setInterval(updateNow, NOW_UPDATE_INTERVAL);
            }
        };
        const stopInterval = () => {
            if (interval) {
                clearInterval(interval);
                interval = undefined;
            }
        };

        startInterval();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                updateNow();
                startInterval();
            } else {
                stopInterval();
            }
        });
    }

    return {
        subscribe
    };
};

// so it is easily accessible globally
export const now = {
    subscribe: (...args: Parameters<GlobalContext['now']['subscribe']>) =>
        getGlobalContext().now.subscribe(...args)
};

const createFavoriteSchedulesStore = (initialFavoriteSchedules: FavoriteSchedule[]) => {
    const { subscribe, update } = writable({
        schedules: initialFavoriteSchedules,
        ofType(scheduleType: ScheduleType) {
            return this.schedules.filter((schedule) => schedule.type === scheduleType);
        },
        isFavorite(scheduleId: string) {
            return this.schedules.some((schedule) => schedule.id === scheduleId);
        }
    });

    const updateCookies = (schedules: FavoriteSchedule[]) => {
        document.cookie = serializeCookie(COOKIE.FAVORITES, JSON.stringify(schedules), {
            path: '/',
            maxAge: MAX_COOKIE_AGE
        });
    };

    // to extend cookie expire date
    if (browser) {
        updateCookies(initialFavoriteSchedules);
    }

    return {
        subscribe,
        remove: (idToRemove: string) =>
            update((store) => {
                store.schedules = store.schedules.filter((schedule) => schedule.id !== idToRemove);
                updateCookies(store.schedules);
                return store;
            }),
        add: (scheduleToAdd: FavoriteSchedule) =>
            update((store) => {
                store.schedules.push(scheduleToAdd);
                updateCookies(store.schedules);
                return store;
            })
    };
};

export const getFavoriteSchedulesStore = () => getGlobalContext().favoriteSchedules;

export const createScheduleViewStore = (initialScheduleView: ScheduleView) => {
    const { subscribe, set } = writable(initialScheduleView);

    const updateCookies = (scheduleView: ScheduleView) => {
        document.cookie = serializeCookie(COOKIE.SCHEDULE_VIEW, scheduleView, {
            path: '/',
            maxAge: MAX_COOKIE_AGE
        });
    };

    // extend cookie age
    if (browser) {
        updateCookies(initialScheduleView);
    }

    return {
        subscribe,
        set: (newScheduleView: ScheduleView) => {
            set(newScheduleView);
            updateCookies(newScheduleView);
        }
    };
};
