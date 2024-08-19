import type { SCHEDULE_TYPES, SCHEDULE_VIEWS } from '$lib/consts';
import type {
    scheduleHeaderSchema,
    scheduleSchema,
    scheduleGroupingSchema,
    pickerStateSchema,
    favoriteScheduleSchema,
    originalScheduleTypeSchema
} from '$lib/server/schemaValidators';

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

export type ScheduleViewComponentProps = {
    scheduleItems: ScheduleItem[];
    scheduleType: ScheduleType;
    currentPeriod: Schedule['periods'][number];
    isMultipleSchedules: boolean;
};

export type FavoriteSchedule = typeof favoriteScheduleSchema._type;
