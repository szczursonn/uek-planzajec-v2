import { languageTag } from '$lib/paraglide/runtime';
import * as m from '$lib/paraglide/messages';
import type { PickerState, ScheduleItem, ScheduleType, ScheduleView } from '$lib/types';
import {
    DEFAULT_SCHEDULE_TYPE,
    SCHEDULE_TYPE_NORMALIZED_TO_ORIGINAL,
    SEARCH_PARAM,
    UEK_TIME_ZONE
} from '$lib/consts';

// amazing name do not change
export const superParseInt = (value?: string) => {
    const n = parseInt(value ?? '');
    return isFinite(n) ? n : undefined;
};

export const cutPostfix = (value: string, postfix: string) =>
    value.endsWith(postfix) ? value.substring(0, value.length - postfix.length) : value;

export const createSchedulePickerURL = ({
    scheduleType = DEFAULT_SCHEDULE_TYPE,
    grouping,
    pickerState
}: {
    scheduleType?: ScheduleType;
    grouping?: string;
    pickerState?: PickerState;
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
            [SEARCH_PARAM.PICKER.STATE]: btoa(JSON.stringify(pickerState))
        }).toString()}`;
    }

    return url;
};

export const createScheduleURL = ({
    scheduleType,
    ids,
    period = 0,
    scheduleView
}: {
    scheduleType: ScheduleType;
    ids: string[];
    period?: number;
    scheduleView?: ScheduleView;
}) => {
    let url = `/schedule/${encodeURIComponent(scheduleType)}/${encodeURIComponent(ids.join('_'))}`;

    if (period !== 0 || scheduleView) {
        url += `/${period}`;

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
    period,
    xml = false
}: {
    scheduleType?: ScheduleType;
    grouping?: string;
    scheduleId?: string;
    period?: number;
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

    if (period !== undefined) {
        url.searchParams.set('okres', (period + 1).toString());
    }

    if (xml) {
        url.searchParams.set('xml', '');
    }

    return url;
};

export const isScheduleItemCancelled = (item: ScheduleItem) => item.type === 'Przeniesienie zajęć';

export const createScheduleItemTypeClassProvider = (
    classes: Partial<
        Record<'lecture' | 'exercise' | 'language' | 'seminar' | 'exam' | 'cancelled', string>
    >,
    fallback?: string
) => {
    const scheduleItemTypeToClass = {
        wykład: classes.lecture,
        'wykład do wyboru': classes.lecture,
        'PPUZ wykład': classes.lecture,
        ćwiczenia: classes.exercise,
        'ćwiczenia do wyboru': classes.exercise,
        'ćwiczenia warsztatowe': classes.exercise,
        'Ćwiczenia e - learningowe': classes.exercise,
        'PPUZ ćwicz. warsztatowe': classes.exercise,
        'PPUZ ćwicz. laboratoryjne': classes.exercise,
        laboratorium: classes.exercise,
        'ćwiczenia audytoryjne': classes.exercise,
        konwersatorium: classes.exercise,
        'konwersatorium do wyboru': classes.exercise,
        lektorat: classes.language,
        'PPUZ lektorat': classes.language,
        seminarium: classes.seminar,
        egzamin: classes.exam,
        'Przeniesienie zajęć': classes.cancelled
    } as Record<string, string>;

    return (type: string) => scheduleItemTypeToClass[type] ?? fallback ?? '';
};

export const createHourRangeLabelProvider = () => {
    const formatter = new Intl.DateTimeFormat(languageTag(), {
        timeZone: UEK_TIME_ZONE,
        hour: 'numeric',
        minute: 'numeric'
    });

    return (start: Date, end: Date) =>
        `${formatter.formatRange(start, end)} (${m.scheduleItemTimeAmount({
            hours: Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 45))
        })})`;
};
