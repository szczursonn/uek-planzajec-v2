import { getUEKApiClient } from '$lib/server/uekAPI';
import type { ScheduleType } from '$lib/types';
import { createScheduleURL, isScheduleItemCancelled, isScheduleItemLanguageSlot } from '$lib/utils';
import ical, { ICalEventStatus } from 'ical-generator';

const FULL_SCHEDULE_PERIOD = 2;

export const GET = async (req) => {
    const schedule = await getUEKApiClient(req.platform).getSchedule(
        req.params.scheduleId,
        req.params.type as ScheduleType,
        FULL_SCHEDULE_PERIOD
    );

    const calendar = ical({
        name: schedule.name,
        url:
            req.url.host +
            createScheduleURL({
                ids: [schedule.id],
                scheduleType: schedule.type,
                period: FULL_SCHEDULE_PERIOD
            }),
        events: schedule.items
            .filter((item) => !isScheduleItemLanguageSlot(item))
            .map((item) => ({
                summary: `[${item.type}] ${item.subject}`,
                status: isScheduleItemCancelled(item)
                    ? ICalEventStatus.CANCELLED
                    : ICalEventStatus.CONFIRMED,
                categories: [{ name: item.type }],
                start: item.start,
                end: item.end,
                location: item.room?.name,
                url: item.room?.url,
                organizer: item.lecturers.length
                    ? {
                          name: item.lecturers.map((lecturer) => lecturer.name).join(', ')
                      }
                    : undefined,
                description: [item.groups.join(', '), item.extra].filter(Boolean).join('\n')
            }))
    });

    return new Response(calendar.toString(), {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="calendar.ics"'
        }
    });
};
