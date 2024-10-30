import { redirect } from '@sveltejs/kit';
import { readSavedScheduleSetsCookie } from '$lib/server/serverUtils';
import { i18n } from '$lib/i18n';
import { createScheduleURL } from '$lib/linkUtils';
import type { ScheduleType } from '$lib/types';

export const GET = (ctx) => {
    const savedScheduleSets = readSavedScheduleSetsCookie(ctx);
    const scheduleType = Object.keys(savedScheduleSets)[0] as ScheduleType | undefined;

    redirect(
        303,
        i18n.resolveRoute(
            scheduleType
                ? createScheduleURL({
                      scheduleIds: savedScheduleSets[scheduleType]![0]!.map(
                          (scheduleHeader) => scheduleHeader.id
                      ),
                      scheduleType
                  })
                : '/'
        )
    );
};
