import { setContext, getContext } from 'svelte';
import { createNowStore } from '$lib/stores/nowStore';
import { createCookieStore } from '$lib/stores/cookieStore';
import { createSavedScheduleSetsStore } from '$lib/stores/savedScheduleSetsStore';
import { createPreferredScheduleViewStore } from '$lib/stores/preferredScheduleViewStore';
import { createSnackbarStore } from '$lib/stores/snackbarStore';

type GlobalContext = {
    nowStore: ReturnType<typeof createNowStore>;
    cookieStore: ReturnType<typeof createCookieStore>;
    savedScheduleSetsStore: ReturnType<typeof createSavedScheduleSetsStore>;
    preferredScheduleViewStore: ReturnType<typeof createPreferredScheduleViewStore>;
    snackbarStore: ReturnType<typeof createSnackbarStore>;
};

const GLOBAL_CONTEXT_KEY = 'uek-global';

export const setGlobalContext = ({
    initialNow,
    initialCookieConsentState,
    initialSavedScheduleSets,
    initialPreferredScheduleView
}: {
    initialNow: Parameters<typeof createNowStore>[0];
    initialCookieConsentState: Parameters<typeof createCookieStore>[0];
    initialSavedScheduleSets: Parameters<typeof createSavedScheduleSetsStore>[0];
    initialPreferredScheduleView: Parameters<typeof createPreferredScheduleViewStore>[0];
}) => {
    const cookieStore = createCookieStore(initialCookieConsentState);

    return setContext<GlobalContext>(GLOBAL_CONTEXT_KEY, {
        nowStore: createNowStore(initialNow),
        cookieStore: cookieStore,
        savedScheduleSetsStore: createSavedScheduleSetsStore(initialSavedScheduleSets, cookieStore),
        preferredScheduleViewStore: createPreferredScheduleViewStore(
            initialPreferredScheduleView,
            cookieStore
        ),
        snackbarStore: createSnackbarStore()
    });
};

export const getGlobalContext = () => getContext<GlobalContext>(GLOBAL_CONTEXT_KEY);
