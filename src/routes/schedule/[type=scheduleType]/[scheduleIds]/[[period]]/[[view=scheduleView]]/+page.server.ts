import { z } from 'zod';
import { redirect } from '@sveltejs/kit';
import { getUEKApiClient } from '$lib/server/uekAPI';
import {
    favoriteScheduleArraySchema,
    favoriteScheduleSchema,
    scheduleTypeSchema,
    scheduleViewSchema
} from '$lib/server/schemaValidators';
import {
    MAX_SELECTABLE_SCHEDULES,
    COOKIE,
    MAX_COOKIE_AGE,
    SEARCH_PARAM,
    DEFAULT_SCHEDULE_VIEW
} from '$lib/consts';
import { createScheduleURL, isScheduleItemLanguageSlot } from '$lib/utils';
import { i18n } from '$lib/i18n';
import type { ScheduleItem } from '$lib/types';

const paramsSchema = z.object({
    type: scheduleTypeSchema,
    scheduleIds: z
        .string()
        .transform((str) => str.split('_'))
        .pipe(z.array(z.string().min(1)).min(1).max(MAX_SELECTABLE_SCHEDULES)),
    period: z.coerce.number().nonnegative().optional().default(0),
    view: scheduleViewSchema.optional()
});

export const load = async (ctx) => {
    const parsedParams = paramsSchema.parse(ctx.params);
    const uekAPI = getUEKApiClient(ctx.platform);

    const schedules = await Promise.all(
        parsedParams.scheduleIds.map((scheduleId) =>
            uekAPI.getSchedule(scheduleId, parsedParams.type, parsedParams.period)
        )
    );

    const items = schedules
        .flatMap((schedule) => schedule.items)
        .sort((a, b) => {
            if (a.start > b.start) {
                return 1;
            }
            if (a.start < b.start) {
                return -1;
            }

            return 0;
        })
        .reduce((items, item) => {
            // 1. Remove duplicates (same schedule item, but from different groups)
            // 2. Remove language slots

            if (isScheduleItemLanguageSlot(item)) {
                return items;
            }

            const prev = items.at(-1);
            if (
                prev &&
                prev.type === item.type &&
                prev.subject === item.subject &&
                prev.start === item.start &&
                prev.end === item.end &&
                prev.room?.name === item.room?.name &&
                prev.room?.url === item.room?.url &&
                prev.extra === item.extra &&
                prev.lecturers.length === item.lecturers.length &&
                prev.lecturers.every(
                    (lecturer, i) =>
                        item.lecturers[i]!.name === lecturer.name &&
                        item.lecturers[i]!.moodleId === lecturer.moodleId
                )
            ) {
                prev.groups = Array.from(new Set([...prev.groups, ...item.groups])).sort();
            } else {
                items.push(item);
            }

            return items;
        }, [] as ScheduleItem[]);

    return {
        headers: schedules.map((schedule) => ({
            id: schedule.id,
            name: schedule.name,
            moodleId: schedule.moodleId
        })),
        items,
        type: schedules[0]!.type,
        periods: schedules[0]!.periods,
        currentPeriodIndex: schedules[0]!.selectedPeriod,
        initialScheduleView:
            parsedParams.view ??
            scheduleViewSchema.safeParse(ctx.cookies.get(COOKIE.SCHEDULE_VIEW)).data ??
            (isMobileBasedOnHeaders(ctx.request.headers)
                ? DEFAULT_SCHEDULE_VIEW.MOBILE
                : DEFAULT_SCHEDULE_VIEW.DESKTOP)
    };
};

export const actions = {
    periodAndView: async (ctx) => {
        const formData = await ctx.request.formData();

        const parsedParams = paramsSchema
            .extend({
                view: scheduleViewSchema
            })
            .parse({
                ...ctx.params,
                period: formData.get(SEARCH_PARAM.SCHEDULE.PERIOD),
                view: formData.get(SEARCH_PARAM.SCHEDULE.VIEW)
            });

        ctx.cookies.set(COOKIE.SCHEDULE_VIEW, parsedParams.view, {
            path: '/',
            maxAge: MAX_COOKIE_AGE,
            httpOnly: false
        });

        redirect(
            303,
            i18n.resolveRoute(
                createScheduleURL({
                    scheduleType: parsedParams.type,
                    ids: parsedParams.scheduleIds,
                    period: parsedParams.period,
                    scheduleView: parsedParams.view
                })
            )
        );
    },
    favoriteAdd: async (ctx) => {
        await handleFavoritesModifyAction(ctx, false);
    },
    favoriteRemove: async (ctx) => {
        await handleFavoritesModifyAction(ctx, true);
    }
};

const handleFavoritesModifyAction = async (
    ctx:
        | Parameters<(typeof actions)['favoriteAdd']>[0]
        | Parameters<(typeof actions)['favoriteRemove']>[0],
    isRemove: boolean
) => {
    const existingFavorites = favoriteScheduleArraySchema.parse(
        JSON.parse(ctx.cookies.get(COOKIE.FAVORITES) ?? '[]')
    );
    const modifiedSchedule = favoriteScheduleSchema.parse(
        JSON.parse((await ctx.request.formData()).get('fav')!.toString())
    );

    const newFavorites = isRemove
        ? existingFavorites.filter((schedule) => schedule.id !== modifiedSchedule.id)
        : [...existingFavorites, modifiedSchedule];
    ctx.cookies.set(COOKIE.FAVORITES, JSON.stringify(newFavorites), {
        path: '/',
        maxAge: MAX_COOKIE_AGE,
        httpOnly: false
    });

    const redirectUrl = new URL(ctx.url);
    redirectUrl.search = '';

    redirect(303, redirectUrl);
};

const isMobileBasedOnHeaders = (headers: Headers) => {
    const secUAMobile = headers.get('Sec-CH-UA-Mobile');
    if (secUAMobile) {
        return secUAMobile === '?1';
    }

    const userAgent = headers.get('User-Agent');
    if (!userAgent) {
        return false;
    }

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};
