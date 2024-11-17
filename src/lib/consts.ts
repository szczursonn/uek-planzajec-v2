import * as m from '$lib/paraglide/messages';
import type { OriginalScheduleType, ScheduleType, SchedulePeriod, ScheduleView } from '$lib/types';

export const REPO_URL = 'https://github.com/szczursonn/uek-planzajec-v2';
export const UEK_TIME_ZONE = 'Europe/Warsaw';
export const MAX_SELECTABLE_SCHEDULES = 3;
export const MAX_SAVED_SCHEDULE_SETS = 10;

export const SCHEDULE_TYPES = ['group', 'lecturer', 'room'] as const;
export const DEFAULT_SCHEDULE_TYPE = 'group' satisfies ScheduleType;
export const SCHEDULE_TYPE_TO_LABELS = {
    group: {
        default: m.scheduleTypeGroup,
        tabName: m.scheduleTypeGroupTabName,
        documentTitle: m.scheduleTypeGroupChooseCTA,
        documentTitleMore: m.scheduleTypeGroupAddNextCTA,
        change: m.scheduleTypeGroupChange
    },
    lecturer: {
        default: m.scheduleTypeLecturer,
        tabName: m.scheduleTypeLecturerTabName,
        documentTitle: m.scheduleTypeLecturerChooseCTA,
        documentTitleMore: m.scheduleTypeLecturerAddNextCTA,
        change: m.scheduleTypeLecturerChange
    },
    room: {
        default: m.scheduleTypeRoom,
        tabName: m.scheduleTypeRoomTabName,
        documentTitle: m.scheduleTypeRoomChooseCTA,
        documentTitleMore: m.scheduleTypeRoomAddNextCTA,
        change: m.scheduleTypeRoomChange
    }
} as const satisfies Record<ScheduleType, unknown>;

export const SCHEDULE_PERIODS = [
    'upcoming',
    'currentSemester',
    'currentYear',
    'previousYear'
] as const;

export const SCHEDULE_PERIOD_TO_CONFIG = {
    upcoming: {
        label: m.periodOptionUpcoming,
        originalId: 2
    },
    currentSemester: {
        label: m.periodOptionFullSemester,
        originalId: 2
    },
    currentYear: {
        label: m.periodOptionFullYear,
        originalId: 3
    },
    previousYear: {
        label: m.periodOptionPastYear,
        originalId: 4
    }
} as const satisfies Record<SchedulePeriod, unknown>;

export const DEFAULT_SCHEDULE_PERIOD = 'upcoming' satisfies SchedulePeriod;

export const SCHEDULE_VIEWS = ['agenda', 'week', 'table', 'ical'] as const;
export const DEFAULT_SCHEDULE_VIEW = {
    DESKTOP: 'week',
    MOBILE: 'agenda'
} as const satisfies Record<string, ScheduleView>;

export const SCHEDULE_VIEW_TO_LABEL = {
    agenda: m.scheduleViewAgenda,
    week: m.scheduleViewWeek,
    table: m.scheduleViewTable,
    ical: m.scheduleViewICal
} as const satisfies Record<ScheduleView, unknown>;

export const COOKIE = {
    COOKIE_CONSENT_STATE: 'UEK-CCS',
    SAVED_SCHEDULES: 'UEK-SS',
    PREFERRED_SCHEDULE_VIEW: 'UEK-PSV'
} as const;

export const SEARCH_PARAM = {
    PICKER: {
        STATE: 'state',
        FILTER: {
            SEARCH: 'q',
            STAGE_MODE: 'stageMode',
            YEAR_SEMESTER: 'yearSemester',
            LANGUAGE: 'lang',
            LANGUAGE_LEVEL: 'langLevel'
        }
    },
    SCHEDULE: {
        PERIOD: 'period',
        VIEW: 'view'
    }
} as const;

export const SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED = {
    G: 'group',
    N: 'lecturer',
    S: 'room'
} as const satisfies Record<OriginalScheduleType, ScheduleType>;

export const SCHEDULE_TYPE_NORMALIZED_TO_ORIGINAL = Object.fromEntries(
    Object.entries(SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED).map(([key, value]) => [value, key])
) as Readonly<Record<ScheduleType, OriginalScheduleType>>;

export const COOKIE_CONFIG = {
    path: '/',
    maxAge: 1_000_000_000,
    httpOnly: false,
    sameSite: 'lax'
} as const;

export const REJECTED_COOKIE_CONSENT_VERSION = 0;
export const CURRENT_COOKIE_CONSENT_VERSION = 2;

export const SCHEDULE_ITEM_RESOLVED_TYPE_MAPPING = {
    wykład: 'lecture',
    'wykład do wyboru': 'lecture',
    'PPUZ wykład': 'lecture',
    ćwiczenia: 'exercise',
    'ćwiczenia do wyboru': 'exercise',
    'ćwiczenia warsztatowe': 'exercise',
    'Ćwiczenia e - learningowe': 'exercise',
    'PPUZ ćwicz. warsztatowe': 'exercise',
    'PPUZ ćwicz. laboratoryjne': 'exercise',
    laboratorium: 'exercise',
    'ćwiczenia audytoryjne': 'exercise',
    konwersatorium: 'exercise',
    'konwersatorium do wyboru': 'exercise',
    lektorat: 'language',
    'PPUZ lektorat': 'language',
    seminarium: 'seminar',
    egzamin: 'exam',
    'Przeniesienie zajęć': 'cancelled'
} as const;

export const LOAD_FN_PERFORMANCE_HEADER = 'X-UEK-LoadTime';
