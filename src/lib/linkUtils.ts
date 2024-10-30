import {
    DEFAULT_SCHEDULE_PERIOD,
    DEFAULT_SCHEDULE_TYPE,
    SCHEDULE_TYPE_NORMALIZED_TO_ORIGINAL,
    SEARCH_PARAM
} from '$lib/consts';
import type { PickerState, ScheduleType, ScheduleView } from '$lib/types';
import { encodePickerState } from '$lib/storeUtils';

export const createSchedulePickerURL = ({
    scheduleType = DEFAULT_SCHEDULE_TYPE,
    grouping,
    pickerState = null
}: {
    scheduleType?: ScheduleType;
    grouping?: string;
    pickerState?: PickerState | null;
} = {}) => {
    let url = '/';
    if (scheduleType !== DEFAULT_SCHEDULE_TYPE || grouping) {
        url += encodeURIComponent(scheduleType);

        if (grouping) {
            url += `/${encodeURIComponent(grouping)}`;
        }
    }

    if (pickerState) {
        url += `?${new URLSearchParams({
            [SEARCH_PARAM.PICKER.STATE]: encodePickerState(pickerState)
        }).toString()}`;
    }

    return url;
};

export const createScheduleURL = ({
    scheduleType,
    scheduleIds,
    periodIndex = DEFAULT_SCHEDULE_PERIOD,
    scheduleView
}: {
    scheduleType: ScheduleType;
    scheduleIds: string[];
    periodIndex?: number;
    scheduleView?: ScheduleView;
}) => {
    let url = `/schedule/${encodeURIComponent(scheduleType)}/${encodeURIComponent(scheduleIds.join('_'))}`;

    if (periodIndex !== DEFAULT_SCHEDULE_PERIOD || scheduleView) {
        url += `/${periodIndex}`;

        if (scheduleView) {
            url += `/${scheduleView}`;
        }
    }

    return url;
};

export const createMoodleURL = (moodleId: string) =>
    `https://e-uczelnia.uek.krakow.pl/course/view.php?id=${encodeURIComponent(moodleId)}`;

export const createOriginalURL = ({
    scheduleType,
    grouping,
    scheduleId,
    periodIndex,
    xml = false
}: {
    scheduleType?: ScheduleType;
    grouping?: string;
    scheduleId?: string;
    periodIndex?: number;
    xml?: boolean;
} = {}) => {
    const url = new URL('https://planzajec.uek.krakow.pl/index.php');

    if (scheduleType) {
        url.searchParams.set('typ', SCHEDULE_TYPE_NORMALIZED_TO_ORIGINAL[scheduleType]);
    }

    if (grouping) {
        url.searchParams.set('grupa', grouping);
    }

    if (scheduleId) {
        url.searchParams.set('id', scheduleId);
    }

    if (periodIndex !== undefined) {
        url.searchParams.set('okres', (periodIndex + 1).toString());
    }

    if (xml) {
        url.searchParams.set('xml', '');
    }

    return url;
};
