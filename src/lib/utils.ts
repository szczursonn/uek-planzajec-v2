import type { Subscriber, Unsubscriber } from 'svelte/store';
import { languageTag } from '$lib/paraglide/runtime';
import * as m from '$lib/paraglide/messages';
import { getAggregateScheduleKey } from '$lib/storeUtils';
import type { AggregateSchedule, DateParts, SavedScheduleSets } from '$lib/types';
import {
    MAX_SAVED_SCHEDULE_SETS,
    SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING,
    SCHEDULE_PERIOD_TO_CONFIG,
    SCHEDULE_TYPE_TO_LABELS,
    UEK_TIME_ZONE
} from '$lib/consts';
import { getDateFromLocalParts } from '$lib/dateUtils';

// amazing name do not change
export const superParseInt = (value?: string) => {
    const n = parseInt(value ?? '');
    return isFinite(n) ? n : undefined;
};

export const cutPostfix = (value: string, postfix: string) =>
    value.endsWith(postfix) ? value.substring(0, value.length - postfix.length) : value;

export const prefixNumberWithZero = (n: number) => `${n < 10 ? '0' : ''}${n}`;

export const isSavedScheduleSetLimitReached = (savedScheduleSets: SavedScheduleSets) => {
    return (
        Object.values(savedScheduleSets)
            .map((arr) => arr.length)
            .reduce((acc, len) => acc + len, 0) >= MAX_SAVED_SCHEDULE_SETS
    );
};

export const resolveScheduleItemType = (type: string) => {
    if (type in SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING) {
        return SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING[
            type as keyof typeof SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING
        ];
    }

    return null;
};

export const getRelativeTimeLabel = (() => {
    const relativeTimeLabelFormatter = new Intl.RelativeTimeFormat(languageTag(), {
        numeric: 'auto',
        style: 'long'
    });

    return (date: Date, now: Date) => {
        const seconds = Math.floor((date.getTime() - now.getTime()) / 1000);
        const secondsAbs = Math.abs(seconds);

        if (secondsAbs < 60) {
            return relativeTimeLabelFormatter.format(seconds, 'seconds');
        }
        if (secondsAbs < 3600) {
            return relativeTimeLabelFormatter.format(Math.floor(seconds / 60), 'minutes');
        }
        if (secondsAbs < 86400) {
            return relativeTimeLabelFormatter.format(Math.floor(seconds / 3600), 'hours');
        }
        if (secondsAbs < 2592000) {
            return relativeTimeLabelFormatter.format(Math.floor(seconds / 86400), 'days');
        }
        if (secondsAbs < 31536000) {
            return relativeTimeLabelFormatter.format(Math.floor(seconds / 2592000), 'months');
        }
        return relativeTimeLabelFormatter.format(Math.floor(seconds / 31536000), 'years');
    };
})();

export const extendAggregateSchedule = (aggregateSchedule: AggregateSchedule, now: Date) => {
    const periodOptionDateFormatter = new Intl.DateTimeFormat(languageTag(), {
        timeZone: UEK_TIME_ZONE,
        dateStyle: 'medium'
    });

    const hourRangeLabelFormatter = new Intl.DateTimeFormat(languageTag(), {
        timeZone: UEK_TIME_ZONE,
        hour: 'numeric',
        minute: 'numeric'
    });
    const getHourRangeLabel = (startDate: Date, endDate: Date) => {
        return `${hourRangeLabelFormatter.formatRange(startDate, endDate)} (${m.scheduleItemTimeAmount(
            {
                hours: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 45))
            }
        )})`;
    };

    let upcomingEncountered = false;
    return {
        ...aggregateSchedule,
        displayName: aggregateSchedule.headers
            .map((scheduleHeader) => scheduleHeader.name)
            .join(', '),
        key: getAggregateScheduleKey(aggregateSchedule.headers),
        typeLabels: SCHEDULE_TYPE_TO_LABELS[aggregateSchedule.type],
        periodOptions: aggregateSchedule.periodOptions.map((periodOption) => {
            const startDate = getDateFromLocalParts(periodOption.startParts);
            const endDate = getDateFromLocalParts(periodOption.endParts);

            return {
                ...periodOption,
                startDate,
                endDate,
                value: periodOption.id,
                label: `${SCHEDULE_PERIOD_TO_CONFIG[periodOption.id].label()} (${periodOptionDateFormatter.formatRange(startDate, endDate)})`
            };
        }),
        items: aggregateSchedule.items.map((item) => {
            const startDate = getDateFromLocalParts(item.startParts);
            const endDate = getDateFromLocalParts(item.endParts);
            const isUpcoming = now < startDate;
            const isFirstUpcoming = isUpcoming && !upcomingEncountered;
            if (isUpcoming) {
                upcomingEncountered = true;
            }

            return {
                ...item,
                resolvedType: resolveScheduleItemType(item.type),
                startDate,
                endDate,
                isUpcoming,
                isFirstUpcoming,
                isInProgress: now >= startDate && now <= endDate,
                isFinished: now > endDate,
                hourRangeLabel: getHourRangeLabel(startDate, endDate)
            };
        })
    };
};

export const compareDateParts = (parts1: DateParts, parts2: DateParts) => {
    for (let i = 0; i < 5; i++) {
        if (parts1[i]! > parts2[i]!) {
            return 1;
        }

        if (parts1[i]! < parts2[i]!) {
            return -1;
        }
    }

    return 0;
};

export const areDatePartsEqual = (parts1: DateParts, parts2: DateParts) => {
    return parts1.every((parts1Value, i) => parts2[i] === parts1Value);
};

export const areDatePartsEqualWithoutTime = (parts1: DateParts, parts2: DateParts) => {
    return parts1[0] === parts2[0] && parts1[1] === parts2[1] && parts1[2] === parts2[2];
};

export const getSyncStoreValue = <T>({
    subscribe
}: {
    subscribe: (callback: Subscriber<T>) => Unsubscriber;
}) => {
    let value: T;
    const unsubscribe = subscribe((storeValue: T) => {
        value = storeValue;
        setTimeout(() => unsubscribe(), 0);
    });

    return value! as T;
};
