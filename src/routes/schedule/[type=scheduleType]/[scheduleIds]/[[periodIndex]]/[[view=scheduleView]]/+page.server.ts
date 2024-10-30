import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { createUEKService } from '$lib/server/uekService';
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
    scheduleSelectedPeriodSchema,
    scheduleTypeSchema,
    scheduleViewSchema
} from '$lib/server/schema';
import {
    COOKIE,
    COOKIE_CONFIG,
    DEFAULT_SCHEDULE_PERIOD,
    DEFAULT_SCHEDULE_TYPE,
    MAX_SAVED_SCHEDULE_SETS,
    MAX_SELECTABLE_SCHEDULES,
    SEARCH_PARAM
} from '$lib/consts';
import { mergeMultipleScheduleItems } from '$lib/utils';
import {
    addToSavedScheduleSet,
    encodeSavedScheduleSets,
    getSavedScheduleSetKey,
    removeFromSavedScheduleSet
} from '$lib/storeUtils';
import { layoutActions } from '$lib/layoutActions';
import type { ScheduleType } from '$lib/types';
import { createScheduleURL } from '$lib/linkUtils.js';

const pageParamsSchema = z.object({
    type: scheduleTypeSchema,
    scheduleIds: z
        .string()
        .transform((str) => str.split('_'))
        .pipe(z.array(scheduleIdSchema).min(1).max(MAX_SELECTABLE_SCHEDULES)),
    periodIndex: z.coerce
        .number()
        .pipe(scheduleSelectedPeriodSchema)
        .optional()
        .default(DEFAULT_SCHEDULE_PERIOD),
    view: scheduleViewSchema.optional()
});

export const load = async (ctx) => {
    const pageParams = pageParamsSchema.parse(ctx.params);

    const uekService = createUEKService(ctx.platform);
    const schedules = await Promise.all(
        pageParams.scheduleIds.map((scheduleId) =>
            uekService.getSchedule({
                scheduleId,
                scheduleType: pageParams.type,
                periodIndex: pageParams.periodIndex
            })
        )
    );

    return {
        headers: schedules.map((schedule) => ({
            id: schedule.id,
            name: schedule.name,
            moodleId: schedule.moodleId
        })),
        items: mergeMultipleScheduleItems(schedules),
        scheduleType: schedules[0]!.type,
        periods: schedules[0]!.periods,
        currentPeriodIndex: schedules[0]!.selectedPeriod
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
        if (
            Object.values(savedScheduleSets)
                .map((arr) => arr.length)
                .reduce((acc, len) => acc + len, 0) >= MAX_SAVED_SCHEDULE_SETS
        ) {
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
            getSavedScheduleSetKey(formData.headers)
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
                [SEARCH_PARAM.SCHEDULE.PERIOD]: z.coerce
                    .number()
                    .pipe(scheduleSelectedPeriodSchema),
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
            createScheduleURL({
                scheduleType: pageParams.type,
                scheduleIds: pageParams.scheduleIds,
                periodIndex: formData[SEARCH_PARAM.SCHEDULE.PERIOD],
                scheduleView: formData[SEARCH_PARAM.SCHEDULE.VIEW]
            })
        );
    }
};
