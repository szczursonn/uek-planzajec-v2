import { languageTag } from '$lib/paraglide/runtime';
import * as m from '$lib/paraglide/messages';
import type { Schedule, ScheduleItem } from '$lib/types';
import { SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING, UEK_TIME_ZONE } from '$lib/consts';

// amazing name do not change
export const superParseInt = (value?: string) => {
    const n = parseInt(value ?? '');
    return isFinite(n) ? n : undefined;
};

export const cutPostfix = (value: string, postfix: string) =>
    value.endsWith(postfix) ? value.substring(0, value.length - postfix.length) : value;

export const isScheduleItemCancelled = (item: ScheduleItem) => item.type === 'Przeniesienie zajęć';
const isScheduleItemLanguageSlot = (item: ScheduleItem) =>
    item.type === 'lektorat' &&
    (item.room?.name === 'Wybierz swoją grupę językową' ||
        (item.lecturers.length === 1 &&
            item.lecturers[0]!.name === 'Językowe Centrum' &&
            !item.room));
const areScheduleItemsDuplicate = (item1: ScheduleItem, item2: ScheduleItem) => {
    return (
        item1.type === item2.type &&
        item1.subject === item2.subject &&
        item1.start === item2.start &&
        item1.end === item2.end &&
        item1.room?.name === item2.room?.name &&
        item1.room?.url === item2.room?.url &&
        item1.extra === item2.extra &&
        item1.lecturers.length === item2.lecturers.length &&
        item1.lecturers.every(
            (item1Lecturer, i) =>
                item1Lecturer.name === item2.lecturers[i]!.name &&
                item1Lecturer.moodleId === item2.lecturers[i]!.moodleId
        )
    );
};

export const mergeMultipleScheduleItems = (schedules: Schedule[]) => {
    return schedules
        .flatMap((schedule) => schedule.items)
        .sort((a, b) => {
            if (a.start > b.start) {
                return 1;
            }
            if (a.start < b.start) {
                return -1;
            }

            return 0;
        })
        .reduce((items, item) => {
            // 1. Remove language slots
            // 2. Remove duplicates (same schedule item, but from different groups)
            if (!isScheduleItemLanguageSlot(item)) {
                const previousItem = items.at(-1);
                if (previousItem && areScheduleItemsDuplicate(previousItem, item)) {
                    items[items.length - 1] = {
                        ...item,
                        groups: Array.from(new Set([...previousItem.groups, ...item.groups])).sort()
                    };
                } else {
                    items.push(item);
                }
            }

            return items;
        }, [] as ScheduleItem[]);
};

export const prefixNumberWithZero = (n: number) => `${n < 10 ? '0' : ''}${n}`;

export const createExtendedScheduleItemProvider = (now: Date) => {
    const hourRangeLabelFormatter = new Intl.DateTimeFormat(languageTag(), {
        timeZone: UEK_TIME_ZONE,
        hour: 'numeric',
        minute: 'numeric'
    });

    return (baseScheduleItem: ScheduleItem) => {
        const startDate = new Date(baseScheduleItem.start);
        const endDate = new Date(baseScheduleItem.end);

        return {
            ...baseScheduleItem,
            resolvedType:
                baseScheduleItem.type in SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING
                    ? SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING[
                          baseScheduleItem.type as keyof typeof SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING
                      ]
                    : null,
            startDate,
            endDate,
            isUpcoming: now < startDate,
            isInProgress: now > startDate && now < endDate,
            isFinished: now > endDate,
            isCancelled: isScheduleItemCancelled(baseScheduleItem),
            hourRangeLabel: `${hourRangeLabelFormatter.formatRange(startDate, endDate)} (${m.scheduleItemTimeAmount(
                {
                    hours: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 45))
                }
            )})`
        };
    };
};
