import { error } from '@sveltejs/kit';
import { z } from 'zod';
import ical, { ICalEventStatus } from 'ical-generator';
import { createUEKService } from '$lib/server/uekService';
import { scheduleIdSchema, scheduleTypeSchema } from '$lib/server/schema';
import { MAX_SELECTABLE_SCHEDULES } from '$lib/consts';
import { isScheduleItemCancelled, mergeMultipleScheduleItems } from '$lib/utils';
import { createMoodleURL, createScheduleURL } from '$lib/linkUtils';

const FULL_SCHEDULE_PERIOD_INDEX = 2;

export const GET = async (ctx) => {
    const paramsParseResult = z
        .object({
            type: scheduleTypeSchema,
            scheduleIds: z
                .string()
                .transform((scheduleIdsConcat) => scheduleIdsConcat.split('/'))
                .pipe(z.array(scheduleIdSchema).min(1).max(MAX_SELECTABLE_SCHEDULES))
        })
        .safeParse(ctx.params);
    if (paramsParseResult.error) {
        error(400);
    }

    const uekService = createUEKService(ctx.platform);

    const schedules = await Promise.all(
        paramsParseResult.data.scheduleIds.map((scheduleId) =>
            uekService.getSchedule({
                scheduleId,
                scheduleType: paramsParseResult.data.type,
                periodIndex: FULL_SCHEDULE_PERIOD_INDEX
            })
        )
    );

    const calendar = ical({
        name: `UEK - ${schedules.map((schedule) => schedule.name).join(', ')}`,
        url:
            ctx.url.origin +
            createScheduleURL({
                scheduleIds: paramsParseResult.data.scheduleIds,
                scheduleType: paramsParseResult.data.type,
                periodIndex: FULL_SCHEDULE_PERIOD_INDEX
            }),
        events: mergeMultipleScheduleItems(schedules).map((item) => ({
            summary: `[${item.type}] ${item.subject}`,
            status: isScheduleItemCancelled(item)
                ? ICalEventStatus.CANCELLED
                : ICalEventStatus.CONFIRMED,
            categories: [{ name: item.type }],
            start: item.start,
            end: item.end,
            location: item.room?.url ? 'Online' : item.room?.name,
            url: item.room?.url,
            organizer:
                item.lecturers.length > 0
                    ? {
                          name: item.lecturers.map((lecturer) => lecturer.name).join(', '),
                          email: 'unknown@invalid.invalid'
                      }
                    : undefined,
            description: [
                item.extra,
                item.room?.url,
                item.lecturers
                    .map((lecturer) =>
                        lecturer.moodleId
                            ? `${lecturer.name} (${createMoodleURL(lecturer.moodleId)})`
                            : lecturer.name
                    )
                    .join(', '),
                item.groups.join(', ')
            ]
                .filter(Boolean)
                .join('\n')
        }))
    });

    return new Response(calendar.toString(), {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="calendar-${paramsParseResult.data.type}-${paramsParseResult.data.scheduleIds.join('_')}-${new Date().toISOString()}.ics"`
        }
    });
};
