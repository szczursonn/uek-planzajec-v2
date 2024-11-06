import type { SCHEDULE_TYPES, SCHEDULE_PERIODS, SCHEDULE_VIEWS } from '$lib/consts';
import type {
    scheduleHeaderSchema,
    aggregateScheduleSchema,
    scheduleGroupingSchema,
    pickerStateSchema,
    originalScheduleTypeSchema,
    savedScheduleSetsSchema,
    cookieConsentStateSchema
} from '$lib/server/schema';
import type { createCookieStore } from '$lib/stores/cookieStore';
import type { extendAggregateSchedule } from '$lib/utils';

export type ScheduleType = (typeof SCHEDULE_TYPES)[number];
export type OriginalScheduleType = typeof originalScheduleTypeSchema._type;
export type ScheduleGrouping = typeof scheduleGroupingSchema._type;
export type ScheduleHeader = typeof scheduleHeaderSchema._type;
export type AggregateSchedule = typeof aggregateScheduleSchema._type;
export type ScheduleItem = AggregateSchedule['items'][number];
export type SchedulePeriod = (typeof SCHEDULE_PERIODS)[number];
export type ScheduleView = (typeof SCHEDULE_VIEWS)[number];

export type PickerState = typeof pickerStateSchema._type;
export type PickerOption = {
    label: string;
    href: string;
};

export type CookieStore = ReturnType<typeof createCookieStore>;

export type CookieConsentState = typeof cookieConsentStateSchema._type;
export type SavedScheduleSets = typeof savedScheduleSetsSchema._type;

export type ExtendedAggregateSchedule = ReturnType<typeof extendAggregateSchedule>;
export type ExtendedScheduleItem = ExtendedAggregateSchedule['items'][number];
export type ResolvedExtendedScheduleItemType = Exclude<ExtendedScheduleItem['resolvedType'], null>;

export type ScheduleViewComponentProps = {
    extendedAggregateSchedule: ExtendedAggregateSchedule;
};
