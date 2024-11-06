import { languageTag } from '$lib/paraglide/runtime';
import * as m from '$lib/paraglide/messages';
import { getAggregateScheduleKey } from '$lib/storeUtils';
import type { AggregateSchedule, SavedScheduleSets } from '$lib/types';
import {
    MAX_SAVED_SCHEDULE_SETS,
    SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING,
    SCHEDULE_PERIOD_TO_CONFIG,
    SCHEDULE_TYPE_TO_LABELS,
    UEK_TIME_ZONE
} from '$lib/consts';

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

export const extendAggregateSchedule = (aggregateSchedule: AggregateSchedule, now: Date) => {
    const hourRangeLabelFormatter = new Intl.DateTimeFormat(languageTag(), {
        timeZone: UEK_TIME_ZONE,
        hour: 'numeric',
        minute: 'numeric'
    });
    const periodOptionDateFormatter = new Intl.DateTimeFormat(languageTag(), {
        timeZone: UEK_TIME_ZONE,
        dateStyle: 'medium'
    });

    const getRelativeTimeLabel = (() => {
        const relativeTimeLabelFormatter = new Intl.RelativeTimeFormat(languageTag(), {
            numeric: 'auto',
            style: 'long'
        });

        return (date: Date) => {
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

    let upcomingEncountered = false;
    return {
        ...aggregateSchedule,
        displayName: aggregateSchedule.headers
            .map((scheduleHeader) => scheduleHeader.name)
            .join(', '),
        key: getAggregateScheduleKey(aggregateSchedule.headers),
        typeLabels: SCHEDULE_TYPE_TO_LABELS[aggregateSchedule.type],
        periodOptions: aggregateSchedule.periodOptions.map((periodOption) => {
            const startDate = new Date(periodOption.start);
            const endDate = new Date(periodOption.end);

            return {
                ...periodOption,
                startDate,
                endDate,
                value: periodOption.id,
                label: `${SCHEDULE_PERIOD_TO_CONFIG[periodOption.id].label()} (${periodOptionDateFormatter.formatRange(startDate, endDate)})`
            };
        }),
        items: aggregateSchedule.items.map((item) => {
            const startDate = new Date(item.start);
            const endDate = new Date(item.end);
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
                hourRangeLabel: `${hourRangeLabelFormatter.formatRange(startDate, endDate)} (${m.scheduleItemTimeAmount(
                    {
                        hours: Math.round(
                            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 45)
                        )
                    }
                )})`,
                startDateRelativeTimeLabel: getRelativeTimeLabel(startDate)
            };
        })
    };
};
