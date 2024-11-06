import { error } from '@sveltejs/kit';
import { z } from 'zod';
import ical, { ICalEventStatus } from 'ical-generator';
import { createUEKService } from '$lib/server/uekService';
import { scheduleIdSchema, scheduleTypeSchema } from '$lib/server/schema';
import { MAX_SELECTABLE_SCHEDULES } from '$lib/consts';
import { resolveScheduleItemType } from '$lib/utils';
import { createMoodleURL, createScheduleURL } from '$lib/linkUtils';

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

    const aggregateSchedule = await createUEKService(ctx.platform).getAggregateSchedule({
        scheduleIds: paramsParseResult.data.scheduleIds,
        scheduleType: paramsParseResult.data.type,
        schedulePeriod: 'currentYear',
        now: new Date()
    });

    const calendar = ical({
        name: `UEK - ${aggregateSchedule.headers.map((scheduleHeader) => scheduleHeader.name).join(', ')}`,
        url:
            ctx.url.origin +
            createScheduleURL({
                scheduleIds: paramsParseResult.data.scheduleIds,
                scheduleType: paramsParseResult.data.type,
                schedulePeriod: 'currentYear'
            }),
        events: aggregateSchedule.items.map((item) => ({
            summary: `[${item.type}] ${item.subject}`,
            status:
                resolveScheduleItemType(item.type) === 'cancelled'
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
