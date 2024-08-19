import { UEK_TIME_ZONE } from '$lib/consts';

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

    return previousMonday;
};
export const getNextSunday = (date: Date) => {
    const nextSunday = new Date(date);

    while (dayOfWeekCheckFormatter.format(nextSunday) !== 'Sun') {
        nextSunday.setTime(nextSunday.getTime() + DATE_LOOP_STEP);
    }

    return nextSunday;
};

const dateCheckFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: UEK_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
});
export const getLocalDateParts = (date: Date) => {
    const parts = dateCheckFormatter.formatToParts(date);
    return {
        minute: parseInt(parts[8]!.value),
        hour: parseInt(parts[6]!.value),
        day: parseInt(parts[2]!.value),
        month: parseInt(parts[0]!.value),
        year: parseInt(parts[4]!.value)
    };
};

// TODO: make the dates have 00:00 local time
export function* eachLocalDayBetween(start: Date, end: Date) {
    const endDateParts = getLocalDateParts(end);
    const currentDate = new Date(start);

    let lastYieldedDateParts: ReturnType<typeof getLocalDateParts> | undefined;
    while (true) {
        const currentDateParts = getLocalDateParts(currentDate);

        if (
            lastYieldedDateParts?.day !== currentDateParts.day ||
            lastYieldedDateParts.month !== currentDateParts.month ||
            lastYieldedDateParts.year !== currentDateParts.year
        ) {
            lastYieldedDateParts = currentDateParts;
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

// Turns localized date + hour strings into an ISO string without timezone
// 1. Parse date and time as if it was UTC
// 2. Offset the date by timezone's offset for that date (may be inaccurate if crossing DST boundary)
// 3. Change the date by 15m at a time to fix the inaccuracy (TZ offsets are in min. 15m increments)
export const parseLocalizedDate = (date: string, time: string = '00:00') => {
    const itemDate = new Date(`${date}T${time}:00.000Z`);
    itemDate.setTime(itemDate.getTime() - getTimezoneOffset(itemDate));

    const [inputYear, inputMonth, inputDay] = date.split('-').map((part) => parseInt(part)) as [
        number,
        number,
        number
    ];
    const [inputHour, inputMinute] = time.split(':').map((part) => parseInt(part)) as [
        number,
        number
    ];

    while (true) {
        const currentDateParts = getLocalDateParts(itemDate);

        if (
            currentDateParts.minute < inputMinute ||
            currentDateParts.hour < inputHour ||
            currentDateParts.day < inputDay ||
            currentDateParts.month < inputMonth ||
            currentDateParts.year < inputYear
        ) {
            itemDate.setTime(itemDate.getTime() + TIME_LOOP_STEP);
        } else if (
            currentDateParts.minute > inputMinute ||
            currentDateParts.hour > inputHour ||
            currentDateParts.day > inputDay ||
            currentDateParts.month > inputMonth ||
            currentDateParts.year > inputYear
        ) {
            itemDate.setTime(itemDate.getTime() - TIME_LOOP_STEP);
        } else {
            break;
        }
    }

    return itemDate;
};
