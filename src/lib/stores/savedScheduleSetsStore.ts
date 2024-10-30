import { writable } from 'svelte/store';
import type { CookieStore, SavedScheduleSets, ScheduleHeader, ScheduleType } from '$lib/types';
import { COOKIE } from '$lib/consts';
import {
    addToSavedScheduleSet,
    createStoreTabSyncer,
    encodeSavedScheduleSets,
    getSavedScheduleSetKey,
    removeFromSavedScheduleSet
} from '$lib/storeUtils';

export const createSavedScheduleSetsStore = (
    initialSavedScheduleSets: SavedScheduleSets,
    cookieStore: CookieStore
) => {
    const { subscribe, update } = writable({
        scheduleSets: structuredClone(initialSavedScheduleSets),
        ofType(scheduleType: ScheduleType) {
            return this.scheduleSets[scheduleType] ?? [];
        },
        isSaved(scheduleType: ScheduleType, savedScheduleSetKey: string) {
            return this.ofType(scheduleType).some(
                (scheduleSet) => getSavedScheduleSetKey(scheduleSet) === savedScheduleSetKey
            );
        }
    });

    const storeTabSyncer = createStoreTabSyncer<SavedScheduleSets>(
        COOKIE.SAVED_SCHEDULES,
        (newScheduleSets) =>
            update((store) => {
                store.scheduleSets = newScheduleSets;
                return store;
            })
    );

    const updateCookie = (savedScheduleSets: SavedScheduleSets) => {
        cookieStore.setCookie(COOKIE.SAVED_SCHEDULES, encodeSavedScheduleSets(savedScheduleSets));
    };

    const unsubscribeFromCookieConsentRejection = cookieStore.subscribeToCookiesAllowedChange(
        (areCookiesAllowed) => {
            if (areCookiesAllowed) {
                const unsubscribe = subscribe((store) => {
                    updateCookie(store.scheduleSets);
                    setTimeout(() => unsubscribe(), 0);
                });
            } else {
                cookieStore.clearCookie(COOKIE.SAVED_SCHEDULES);
            }
        }
    );

    return {
        subscribe,
        add(scheduleType: ScheduleType, scheduleSet: ScheduleHeader[]) {
            update((store) => {
                addToSavedScheduleSet(store.scheduleSets, scheduleType, scheduleSet);
                updateCookie(store.scheduleSets);
                storeTabSyncer.notifyChange(store.scheduleSets);

                return store;
            });
        },
        remove(scheduleType: ScheduleType, savedScheduleSetKey: string) {
            update((store) => {
                removeFromSavedScheduleSet(store.scheduleSets, scheduleType, savedScheduleSetKey);
                updateCookie(store.scheduleSets);
                storeTabSyncer.notifyChange(store.scheduleSets);

                return store;
            });
        },
        cleanup() {
            storeTabSyncer.cleanup();
            unsubscribeFromCookieConsentRejection();
        }
    };
};
