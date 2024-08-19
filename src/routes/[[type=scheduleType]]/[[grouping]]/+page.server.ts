import type { ScheduleHeader, ScheduleType } from '$lib/types';
import { getUEKApiClient } from '$lib/server/uekAPI';
import { favoriteScheduleArraySchema, parsePickerState } from '$lib/server/schemaValidators';
import { COOKIE, DEFAULT_SCHEDULE_TYPE, MAX_COOKIE_AGE, SEARCH_PARAM } from '$lib/consts';

export const load = async (ctx) => {
    // ctx.params.type already validated by matcher
    const scheduleType = (ctx.params.type ?? DEFAULT_SCHEDULE_TYPE) as ScheduleType;
    const pickerState = parsePickerState(ctx.url.searchParams.get(SEARCH_PARAM.PICKER.STATE));
    const uekAPI = getUEKApiClient(ctx.platform);

    let pageData:
        | { isHeader: true; headers: ScheduleHeader[] }
        | { isHeader: false; groupings: string[] };
    if (ctx.params.grouping || scheduleType === 'lecturer') {
        const headers = await uekAPI.getScheduleHeaders(scheduleType, ctx.params.grouping);

        const selectedSchedulesIds = new Set(pickerState?.ids ?? []);
        pageData = {
            isHeader: true,
            headers: headers
                .filter((header) => !selectedSchedulesIds.has(header.id))
                .sort((a, b) => {
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (b.name > a.name) {
                        return -1;
                    }
                    return 0;
                })
        };
    } else {
        const groupings = await uekAPI.getScheduleGroupings();

        pageData = {
            isHeader: false,
            groupings: groupings
                .filter((grouping) => grouping.type === scheduleType)
                .map((grouping) => grouping.name)
                .sort()
        };
    }

    return {
        scheduleType,
        pickerState,
        ...pageData
    };
};

export const actions = {
    // favorite delete
    default: async (ctx) => {
        const idToDelete = (await ctx.request.formData()).get('fav')?.toString();
        const existingFavorites = favoriteScheduleArraySchema.parse(
            JSON.parse(ctx.cookies.get(COOKIE.FAVORITES) ?? '[]')
        );

        ctx.cookies.set(
            COOKIE.FAVORITES,
            JSON.stringify(
                existingFavorites.filter((favoriteSchedule) => favoriteSchedule.id !== idToDelete)
            ),
            {
                path: '/',
                maxAge: MAX_COOKIE_AGE,
                httpOnly: false
            }
        );
    }
};
