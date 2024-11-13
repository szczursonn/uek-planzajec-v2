import { UEK_TIME_ZONE } from '$lib/consts';
import { areDatePartsEqualWithoutTime, compareDateParts, prefixNumberWithZero } from '$lib/utils';
import type { DateParts } from '$lib/types';

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

    return getDateWithoutLocalTime(previousMonday);
};
export const getNextSunday = (date: Date) => {
    const nextSunday = new Date(date);

    while (dayOfWeekCheckFormatter.format(nextSunday) !== 'Sun') {
        nextSunday.setTime(nextSunday.getTime() + DATE_LOOP_STEP);
    }

    return getDateWithoutLocalTime(nextSunday);
};

const localDatePartsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: UEK_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false
});

const localDatePartTypeToIndex = localDatePartsFormatter.formatToParts(new Date(0)).reduce(
    (map, part, i) => ({
        ...map,
        [part.type]: i
    }),
    {} as Record<Intl.DateTimeFormatPart['type'], number>
);

export const getLocalDateParts = (date: Date) => {
    const parts = localDatePartsFormatter.formatToParts(date);

    return [
        parseInt(parts[localDatePartTypeToIndex.year]!.value),
        parseInt(parts[localDatePartTypeToIndex.month]!.value),
        parseInt(parts[localDatePartTypeToIndex.day]!.value),
        parseInt(parts[localDatePartTypeToIndex.hour]!.value),
        parseInt(parts[localDatePartTypeToIndex.minute]!.value)
    ] as DateParts;
};

const isLastDayOfMonth = (dateParts: DateParts) => {
    if (dateParts[1] === 2) {
        if (dateParts[0] % 4 === 0 && dateParts[0] % 100 !== 0) {
            return dateParts[2] === 29;
        } else {
            return dateParts[2] === 28;
        }
    }

    if (
        dateParts[1] === 1 ||
        dateParts[1] === 3 ||
        dateParts[1] === 5 ||
        dateParts[1] === 7 ||
        dateParts[1] === 8 ||
        dateParts[1] === 10 ||
        dateParts[1] === 12
    ) {
        return dateParts[2] === 31;
    }

    return dateParts[2] === 30;
};

export function* eachDatePartsBetween(startParts: DateParts, endParts: DateParts) {
    const currentParts = [startParts[0], startParts[1], startParts[2], 0, 0] as DateParts;

    while (true) {
        yield currentParts;

        if (areDatePartsEqualWithoutTime(currentParts, endParts)) {
            break;
        }

        if (isLastDayOfMonth(currentParts)) {
            currentParts[2] = 1;

            if (currentParts[1] === 12) {
                currentParts[0]++;
                currentParts[1] = 1;
            } else {
                currentParts[1]++;
            }
        } else {
            currentParts[2]++;
        }
    }
}

export const getDateFromLocalParts = (dateParts: DateParts) => {
    // Parse the date as if it was UTC
    const itemDate = new Date(
        `${dateParts[0]}-${prefixNumberWithZero(dateParts[1])}-${prefixNumberWithZero(dateParts[2])}T${prefixNumberWithZero(dateParts[3])}:${prefixNumberWithZero(dateParts[4])}:00.000Z`
    );

    // Offset the date by timezone's offset for that date (may be inaccurate if DST boundary has been crossed)
    itemDate.setTime(itemDate.getTime() - getTimezoneOffset(itemDate));

    // Change the date a little bit at a time to fix the inaccuracy (super inefficient)
    while (true) {
        const compareDatePartsResult = compareDateParts(dateParts, getLocalDateParts(itemDate));

        if (compareDatePartsResult === 1) {
            itemDate.setTime(itemDate.getTime() + TIME_LOOP_STEP);
        } else if (compareDatePartsResult === -1) {
            itemDate.setTime(itemDate.getTime() - TIME_LOOP_STEP);
        } else {
            break;
        }
    }

    return itemDate;
};

export const getDateWithoutLocalTime = (date: Date) => {
    const localDateParts = getLocalDateParts(date);
    // optimization: do not call getDateFromLocalParts unnecessarily
    if (localDateParts[3] !== 0 || localDateParts[4] !== 0) {
        return getDateFromLocalParts([
            localDateParts[0],
            localDateParts[1],
            localDateParts[2],
            0,
            0
        ]);
    }

    return date;
};
