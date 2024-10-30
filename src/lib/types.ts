import type { SCHEDULE_TYPES, SCHEDULE_VIEWS } from '$lib/consts';
import type {
    scheduleHeaderSchema,
    scheduleSchema,
    scheduleGroupingSchema,
    pickerStateSchema,
    originalScheduleTypeSchema,
    savedScheduleSetsSchema,
    cookieConsentStateSchema
} from '$lib/server/schema';
import type { createCookieStore } from '$lib/stores/cookieStore';
import type { createExtendedScheduleItemProvider } from '$lib/utils';

export type ScheduleType = (typeof SCHEDULE_TYPES)[number];
export type OriginalScheduleType = typeof originalScheduleTypeSchema._type;
export type ScheduleGrouping = typeof scheduleGroupingSchema._type;
export type ScheduleHeader = typeof scheduleHeaderSchema._type;
export type Schedule = typeof scheduleSchema._type;
export type ScheduleItem = Schedule['items'][number];
export type ScheduleView = (typeof SCHEDULE_VIEWS)[number];

export type PickerState = typeof pickerStateSchema._type;
export type PickerOption = {
    label: string;
    href: string;
};

export type CookieStore = ReturnType<typeof createCookieStore>;

export type CookieConsentState = typeof cookieConsentStateSchema._type;
export type SavedScheduleSets = typeof savedScheduleSetsSchema._type;

export type ExtendedScheduleItem = ReturnType<
    ReturnType<typeof createExtendedScheduleItemProvider>
>;
export type ResolvedScheduleItemType = Exclude<ExtendedScheduleItem['resolvedType'], null>;

export type ScheduleViewComponentProps = {
    headers: ScheduleHeader[];
    scheduleItems: ExtendedScheduleItem[];
    scheduleType: ScheduleType;
    currentPeriod: Schedule['periods'][number];
};
