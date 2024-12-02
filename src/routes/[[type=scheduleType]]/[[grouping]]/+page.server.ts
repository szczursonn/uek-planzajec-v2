import { getScheduleGroupings, getScheduleHeaders } from '$lib/server/uekService';
import { readPickerState } from '$lib/server/serverUtils';
import type { ScheduleHeader, ScheduleType } from '$lib/types';
import { DEFAULT_SCHEDULE_TYPE, LOAD_FN_PERFORMANCE_HEADER } from '$lib/consts';
import { layoutActions } from '$lib/layoutActions';

export const load = async (ctx) => {
    const loadStartTimestamp = Date.now();

    // ctx.params.type already validated by matcher
    const scheduleType = (ctx.params.type ?? DEFAULT_SCHEDULE_TYPE) as ScheduleType;
    const pickerState = readPickerState(ctx);

    let pageData:
        | { isHeader: true; headers: ScheduleHeader[] }
        | { isHeader: false; groupings: string[] };
    if (ctx.params.grouping || scheduleType === 'lecturer') {
        const headers = await getScheduleHeaders({
            scheduleType,
            grouping: ctx.params.grouping
        });

        const selectedSchedulesIds = new Set(pickerState?.scheduleIds ?? []);
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
        const groupings = await getScheduleGroupings();

        pageData = {
            isHeader: false,
            groupings: groupings
                .filter((grouping) => grouping.type === scheduleType)
                .map((grouping) => grouping.name)
                .sort()
        };
    }

    ctx.setHeaders({
        [LOAD_FN_PERFORMANCE_HEADER]: (Date.now() - loadStartTimestamp).toString()
    });

    return {
        scheduleType,
        pickerState,
        ...pageData
    };
};

export const actions = layoutActions;
