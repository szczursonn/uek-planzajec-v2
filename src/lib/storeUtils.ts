import { browser } from '$app/environment';
import type {
    CookieConsentState,
    PickerState,
    SavedScheduleSets,
    ScheduleHeader,
    ScheduleType
} from '$lib/types';

export const encodePickerState = (pickerState: PickerState) => {
    return btoa(`${pickerState.schedulePeriod}.${pickerState.scheduleIds.join('.')}`);
};

export const getAggregateScheduleKey = (scheduleHeaders: ScheduleHeader[]) =>
    scheduleHeaders
        .map((schedule) => schedule.id)
        .sort()
        .join('');

export const addToSavedScheduleSet = (
    savedScheduleSets: SavedScheduleSets,
    scheduleType: ScheduleType,
    newSavedScheduleSet: ScheduleHeader[]
) => {
    const newSavedScheduleSetKey = getAggregateScheduleKey(newSavedScheduleSet);
    savedScheduleSets[scheduleType] = savedScheduleSets[scheduleType] ?? [];

    if (
        savedScheduleSets[scheduleType].every(
            (scheduleSet) => getAggregateScheduleKey(scheduleSet) !== newSavedScheduleSetKey
        )
    ) {
        savedScheduleSets[scheduleType].push(newSavedScheduleSet);
    }
};

export const removeFromSavedScheduleSet = (
    savedScheduleSets: SavedScheduleSets,
    scheduleType: ScheduleType,
    savedScheduleSetKey: string
) => {
    if (!savedScheduleSets[scheduleType]) {
        return;
    }

    savedScheduleSets[scheduleType] = savedScheduleSets[scheduleType].filter(
        (scheduleSet) => getAggregateScheduleKey(scheduleSet) !== savedScheduleSetKey
    );
    if (savedScheduleSets[scheduleType].length === 0) {
        delete savedScheduleSets[scheduleType];
    }
};

export const encodeCookieConsentState = (cookieConsentState: CookieConsentState) => {
    return `${cookieConsentState.version}.${cookieConsentState.forceShowNotice ? '1' : '0'}`;
};

export const encodeSavedScheduleSets = (savedScheduleSets: SavedScheduleSets) => {
    return stringifyJSONAsBase64(
        Object.fromEntries(
            Object.keys(savedScheduleSets).map((scheduleType) => [
                scheduleType,
                savedScheduleSets[scheduleType as ScheduleType]!.map((scheduleSet) =>
                    scheduleSet.map((scheduleHeader) => [scheduleHeader.id, scheduleHeader.name])
                )
            ])
        )
    );
};

export const stringifyJSONAsBase64 = (value: unknown) => btoa(JSON.stringify(value));

// TODO: add initial sync, for when cookies are not allowed or there is a race condition
export const createStoreTabSyncer = <T>(key: string, onSyncCallback: (value: T) => void) => {
    if (!browser) {
        return {
            notifyChange() {},
            cleanup() {}
        };
    }

    const broadcastChannel = new BroadcastChannel(key);
    broadcastChannel.onmessage = (event) => onSyncCallback(event.data);
    broadcastChannel.onmessageerror = (event) => {
        console.error('tab sync error', key, event);
    };

    return {
        notifyChange(value: T) {
            broadcastChannel.postMessage(value);
        },
        cleanup() {
            broadcastChannel.close();
        }
    };
};
