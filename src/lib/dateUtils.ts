import { UEK_TIME_ZONE } from '$lib/consts';
import { prefixNumberWithZero } from '$lib/utils';

const DATE_LOOP_STEP = 1000 * 60 * 60 * 12; //12h
const TIME_LOOP_STEP = 1000 * 60 * 15; // 15m

const timeZoneCheckFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: UEK_TIME_ZONE,
    timeZoneName: 'longOffset'
});
const getTimezoneOffset = (date: Date) => {
    const offsetString = timeZoneCheckFormatter.formatToParts(date).at(-1)!.value.substring(3);

    if (offsetString === '') {
        return 0;
    }

    const [hourOffset, minuteOffset] = offsetString.split(':').map((part) => parseInt(part)) as [
        number,
        number
    ];

    return (
        hourOffset * 60 * 60 * 1000 + (hourOffset > 0 ? minuteOffset : -minuteOffset) * 60 * 1000
    );
};

const dayOfWeekCheckFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: UEK_TIME_ZONE,
    weekday: 'short'
});
export const getPreviousMonday = (date: Date) => {
    const previousMonday = new Date(date);

    while (dayOfWeekCheckFormatter.format(previousMonday) !== 'Mon') {
        previousMonday.setTime(previousMonday.getTime() - DATE_LOOP_STEP);
    }

    return removeLocalTime(previousMonday);
};
export const getNextSunday = (date: Date) => {
    const nextSunday = new Date(date);

    while (dayOfWeekCheckFormatter.format(nextSunday) !== 'Sun') {
        nextSunday.setTime(nextSunday.getTime() + DATE_LOOP_STEP);
    }

    return removeLocalTime(nextSunday);
};

export const getLocalDateParts = (() => {
    const datePartsFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: UEK_TIME_ZONE,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
        hour12: false
    });

    const partTypeToIndex = datePartsFormatter.formatToParts(new Date(0)).reduce(
        (map, part, i) => ({
            ...map,
            [part.type]: i
        }),
        {} as Record<Intl.DateTimeFormatPart['type'], number>
    );

    return (date: Date) => {
        const parts = datePartsFormatter.formatToParts(date);
        return {
            minute: parseInt(parts[partTypeToIndex.minute]!.value),
            hour: parseInt(parts[partTypeToIndex.hour]!.value),
            day: parseInt(parts[partTypeToIndex.day]!.value),
            month: parseInt(parts[partTypeToIndex.month]!.value),
            year: parseInt(parts[partTypeToIndex.year]!.value)
        };
    };
})();

export function* eachLocalDayBetween(start: Date, end: Date) {
    const endDateParts = getLocalDateParts(end);
    let currentDate = new Date(start);

    let lastYieldedDateParts: ReturnType<typeof getLocalDateParts> | undefined;
    while (true) {
        const currentDateParts = getLocalDateParts(currentDate);

        if (
            lastYieldedDateParts?.day !== currentDateParts.day ||
            lastYieldedDateParts.month !== currentDateParts.month ||
            lastYieldedDateParts.year !== currentDateParts.year
        ) {
            lastYieldedDateParts = currentDateParts;
            currentDate = removeLocalTime(currentDate);
            yield currentDate;
        }

        currentDate.setTime(currentDate.getTime() + DATE_LOOP_STEP);

        if (
            currentDateParts.day === endDateParts.day &&
            currentDateParts.month === endDateParts.month &&
            currentDateParts.year === endDateParts.year
        ) {
            break;
        }
    }
}

export const getDateFromLocalParts = ({
    year,
    month,
    day,
    hour = 0,
    minute = 0
}: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
}) => {
    // Parse the date as if it was UTC
    const itemDate = new Date(
        `${year}-${prefixNumberWithZero(month)}-${prefixNumberWithZero(day)}T${prefixNumberWithZero(hour)}:${prefixNumberWithZero(minute)}:00.000Z`
    );

    // Offset the date by timezone's offset for that date (may be inaccurate if DST boundary has been crossed)
    itemDate.setTime(itemDate.getTime() - getTimezoneOffset(itemDate));

    // Change the date a little bit at a time to fix the inaccuracy
    while (true) {
        const currentDateParts = getLocalDateParts(itemDate);

        if (
            currentDateParts.minute < minute ||
            currentDateParts.hour < hour ||
            currentDateParts.day < day ||
            currentDateParts.month < month ||
            currentDateParts.year < year
        ) {
            itemDate.setTime(itemDate.getTime() + TIME_LOOP_STEP);
        } else if (
            currentDateParts.minute > minute ||
            currentDateParts.hour > hour ||
            currentDateParts.day > day ||
            currentDateParts.month > month ||
            currentDateParts.year > year
        ) {
            itemDate.setTime(itemDate.getTime() - TIME_LOOP_STEP);
        } else {
            break;
        }
    }

    return itemDate;
};

const removeLocalTime = (date: Date) => {
    const localDateParts = getLocalDateParts(date);
    // optimization: do not call getDateFromLocalParts unnecessarily
    if (localDateParts.hour !== 0 || localDateParts.minute !== 0) {
        return getDateFromLocalParts({
            ...getLocalDateParts(date),
            hour: 0,
            minute: 0
        });
    }

    return date;
};
