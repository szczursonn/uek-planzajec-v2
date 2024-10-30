import { writable } from 'svelte/store';
import { COOKIE } from '$lib/consts';
import type { CookieStore, ScheduleView } from '$lib/types';
import { createStoreTabSyncer } from '$lib/storeUtils';

export const createPreferredScheduleViewStore = (
    initialPreferredScheduleView: ScheduleView,
    cookieStore: CookieStore
) => {
    const { subscribe, set } = writable(initialPreferredScheduleView);

    const tabSyncer = createStoreTabSyncer<ScheduleView>(
        COOKIE.PREFERRED_SCHEDULE_VIEW,
        (newPreferredScheduleView) => set(newPreferredScheduleView)
    );

    const updateCookie = (preferredScheduleView: ScheduleView) => {
        cookieStore.setCookie(COOKIE.PREFERRED_SCHEDULE_VIEW, preferredScheduleView);
    };

    const unsubscribeFromCookieConsentRejection = cookieStore.subscribeToCookiesAllowedChange(
        (areCookiesAllowed) => {
            if (areCookiesAllowed) {
                const unsubscribe = subscribe((preferredScheduleView) => {
                    updateCookie(preferredScheduleView);
                    setTimeout(() => unsubscribe(), 0);
                });
            } else {
                cookieStore.clearCookie(COOKIE.PREFERRED_SCHEDULE_VIEW);
            }
        }
    );

    return {
        subscribe,
        set(newPreferredScheduleView: ScheduleView) {
            set(newPreferredScheduleView);
            updateCookie(newPreferredScheduleView);
            tabSyncer.notifyChange(newPreferredScheduleView);
        },
        cleanup() {
            tabSyncer.cleanup();
            unsubscribeFromCookieConsentRejection();
        }
    };
};
