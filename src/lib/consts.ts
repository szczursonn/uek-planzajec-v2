import * as m from '$lib/paraglide/messages';
import type { OriginalScheduleType, ScheduleType, ScheduleView } from '$lib/types';

export const REPO_URL = 'https://github.com/szczursonn/uek-planzajec-v2';
export const UEK_TIME_ZONE = 'Europe/Warsaw';
export const MAX_SELECTABLE_SCHEDULES = 3;

export const SCHEDULE_TYPES = ['group', 'lecturer', 'room'] as const;
export const DEFAULT_SCHEDULE_TYPE = 'group' satisfies ScheduleType;
export const SCHEDULE_TYPE_TO_LABELS = {
    group: {
        default: m.scheduleTypeGroup,
        tabName: m.scheduleTypeGroupTabName,
        documentTitle: m.scheduleTypeGroupChooseCTA,
        documentTitleMore: m.scheduleTypeGroupAddNextCTA
    },
    lecturer: {
        default: m.scheduleTypeLecturer,
        tabName: m.scheduleTypeLecturerTabName,
        documentTitle: m.scheduleTypeLecturerChooseCTA,
        documentTitleMore: m.scheduleTypeLecturerAddNextCTA
    },
    room: {
        default: m.scheduleTypeRoom,
        tabName: m.scheduleTypeRoomTabName,
        documentTitle: m.scheduleTypeRoomChooseCTA,
        documentTitleMore: m.scheduleTypeRoomAddNextCTA
    }
} as const satisfies Record<ScheduleType, unknown>;

export const SCHEDULE_VIEWS = ['agenda', 'week', 'table'] as const;
export const DEFAULT_SCHEDULE_VIEW = 'agenda' satisfies ScheduleView;
export const SCHEDULE_VIEW_TO_LABEL = {
    agenda: m.scheduleViewAgenda,
    week: m.scheduleViewWeek,
    table: m.scheduleViewTable
} as const satisfies Record<ScheduleView, unknown>;

export const COOKIE = {
    FAVORITES: 'UEK-FAV',
    SCHEDULE_VIEW: 'UEK-VIEW'
} as const;
export const MAX_COOKIE_AGE = 1_000_000_000;

export const SEARCH_PARAM = {
    PICKER: {
        STATE: 'state',
        SEARCH: 'q',
        STAGE_MODE: 'stageMode',
        YEAR_SEMESTER: 'yearSemester',
        LANGUAGE: 'lang',
        LANGUAGE_LEVEL: 'langLevel'
    },
    SCHEDULE: {
        PERIOD: 'period',
        VIEW: 'view'
    }
} as const;

export const SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED: Record<OriginalScheduleType, ScheduleType> = {
    G: 'group',
    N: 'lecturer',
    S: 'room'
};

export const SCHEDULE_TYPE_NORMALIZED_TO_ORIGINAL = Object.fromEntries(
    Object.entries(SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED).map(([key, value]) => [value, key])
) as Record<ScheduleType, OriginalScheduleType>;
