import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getAggregateSchedule } from '$lib/server/uekService';
import {
    areCookiesEnabled,
    assertCookiesAreEnabled,
    readCookieConsentStateCookie,
    readSavedScheduleSetsCookie,
    redirectAfterFormActionComplete
} from '$lib/server/serverUtils';
import {
    scheduleHeaderSchema,
    scheduleIdSchema,
    schedulePeriodSchema,
    scheduleTypeSchema,
    scheduleViewSchema
} from '$lib/server/schema';
import {
    COOKIE,
    COOKIE_CONFIG,
    DEFAULT_SCHEDULE_PERIOD,
    DEFAULT_SCHEDULE_TYPE,
    LOAD_FN_PERFORMANCE_HEADER,
    MAX_SELECTABLE_SCHEDULES,
    SEARCH_PARAM
} from '$lib/consts';
import {
    addToSavedScheduleSet,
    encodeSavedScheduleSets,
    getAggregateScheduleKey,
    removeFromSavedScheduleSet
} from '$lib/storeUtils';
import { layoutActions } from '$lib/layoutActions';
import type { ScheduleType } from '$lib/types';
import { createScheduleURL } from '$lib/linkUtils';
import { isSavedScheduleSetLimitReached } from '$lib/utils';
import { i18n } from '$lib/i18n';

const pageParamsSchema = z.object({
    type: scheduleTypeSchema,
    scheduleIds: z
        .string()
        .transform((str) => str.split('_'))
        .pipe(z.array(scheduleIdSchema).min(1).max(MAX_SELECTABLE_SCHEDULES)),
    periodId: schedulePeriodSchema.optional().default(DEFAULT_SCHEDULE_PERIOD),
    view: scheduleViewSchema.optional()
});

export const load = async (ctx) => {
    const loadStartTimestamp = Date.now();

    const pageParams = pageParamsSchema.parse(ctx.params);

    const aggregateSchedule = await getAggregateSchedule({
        scheduleIds: pageParams.scheduleIds,
        scheduleType: pageParams.type,
        schedulePeriod: pageParams.periodId,
        now: new Date((await ctx.parent()).initialNowAsNumber)
    });

    ctx.setHeaders({
        [LOAD_FN_PERFORMANCE_HEADER]: (Date.now() - loadStartTimestamp).toString()
    });

    return {
        aggregateSchedule
    };
};

const readSavedScheduleSetFormData = async (ctx: RequestEvent) => {
    return z
        .object({
            headers: z
                .string()
                .transform((value) => JSON.parse(value))
                .pipe(z.array(scheduleHeaderSchema).min(1).max(MAX_SELECTABLE_SCHEDULES))
        })
        .parse(Object.fromEntries((await ctx.request.formData()).entries()));
};

export const actions = {
    ...layoutActions,
    async addSavedScheduleSet(ctx) {
        assertCookiesAreEnabled(readCookieConsentStateCookie(ctx));

        const savedScheduleSets = readSavedScheduleSetsCookie(ctx);
        if (isSavedScheduleSetLimitReached(savedScheduleSets)) {
            error(400);
        }

        const formData = await readSavedScheduleSetFormData(ctx);
        const scheduleType = (ctx.params.type ?? DEFAULT_SCHEDULE_TYPE) as ScheduleType;

        addToSavedScheduleSet(savedScheduleSets, scheduleType, formData.headers);

        ctx.cookies.set(
            COOKIE.SAVED_SCHEDULES,
            encodeSavedScheduleSets(savedScheduleSets),
            COOKIE_CONFIG
        );
        redirectAfterFormActionComplete(ctx);
    },
    async removeSavedScheduleSet(ctx) {
        assertCookiesAreEnabled(readCookieConsentStateCookie(ctx));

        const savedScheduleSets = readSavedScheduleSetsCookie(ctx);
        const scheduleType = (ctx.params.type ?? DEFAULT_SCHEDULE_TYPE) as ScheduleType;
        const formData = await readSavedScheduleSetFormData(ctx);

        removeFromSavedScheduleSet(
            savedScheduleSets,
            scheduleType,
            getAggregateScheduleKey(formData.headers)
        );

        ctx.cookies.set(
            COOKIE.SAVED_SCHEDULES,
            encodeSavedScheduleSets(savedScheduleSets),
            COOKIE_CONFIG
        );
        redirectAfterFormActionComplete(ctx);
    },
    async setPeriodAndView(ctx) {
        const pageParams = pageParamsSchema.parse(ctx.params);
        const formData = z
            .object({
                [SEARCH_PARAM.SCHEDULE.PERIOD]: schedulePeriodSchema,
                [SEARCH_PARAM.SCHEDULE.VIEW]: scheduleViewSchema
            })
            .parse(Object.fromEntries((await ctx.request.formData()).entries()));

        if (areCookiesEnabled(readCookieConsentStateCookie(ctx))) {
            ctx.cookies.set(
                COOKIE.PREFERRED_SCHEDULE_VIEW,
                formData[SEARCH_PARAM.SCHEDULE.VIEW],
                COOKIE_CONFIG
            );
        }

        redirect(
            303,
            i18n.resolveRoute(
                createScheduleURL({
                    scheduleType: pageParams.type,
                    scheduleIds: pageParams.scheduleIds,
                    schedulePeriod: formData[SEARCH_PARAM.SCHEDULE.PERIOD],
                    scheduleView: formData[SEARCH_PARAM.SCHEDULE.VIEW]
                })
            )
        );
    }
};
