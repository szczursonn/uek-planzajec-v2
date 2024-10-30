import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { z, type ZodSchema } from 'zod';
import {
    savedScheduleSetsSchema,
    pickerStateSchema,
    scheduleViewSchema,
    cookieConsentStateSchema,
    scheduleTypeSchema,
    scheduleIdSchema,
    scheduleNameSchema,
    scheduleSelectedPeriodSchema
} from '$lib/server/schema';
import {
    COOKIE,
    CURRENT_COOKIE_CONSENT_VERSION,
    REJECTED_COOKIE_CONSENT_VERSION,
    SEARCH_PARAM
} from '$lib/consts';
import type { CookieConsentState, ScheduleType } from '$lib/types';

const readBase64EncodedJSONAndParseSchema = <T extends ZodSchema>(
    value: unknown,
    schema: T
): T['_type'] => {
    if (typeof value !== 'string') {
        throw new Error('value is not a string');
    }

    return schema.parse(JSON.parse(atob(value)));
};

// "version.forceShowNotice", e.g. "2.1", "1.0"
export const readCookieConsentStateCookie = (ctx: RequestEvent) => {
    try {
        return z
            .string()
            .transform((stringValue) => stringValue.split('.'))
            .pipe(z.tuple([z.string(), z.string()]))
            .transform((stringParts) => ({
                version: parseInt(stringParts[0]),
                forceShowNotice: stringParts[1] === '1'
            }))
            .pipe(cookieConsentStateSchema)
            .parse(ctx.cookies.get(COOKIE.COOKIE_CONSENT_STATE));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
        return cookieConsentStateSchema.parse({
            version: REJECTED_COOKIE_CONSENT_VERSION,
            forceShowNotice: true
        });
    }
};

export const readSavedScheduleSetsCookie = (ctx: RequestEvent) => {
    try {
        return readBase64EncodedJSONAndParseSchema(
            ctx.cookies.get(COOKIE.SAVED_SCHEDULES),
            z
                .record(
                    scheduleTypeSchema,
                    z.array(z.array(z.tuple([scheduleIdSchema, scheduleNameSchema])))
                )
                .transform((compactSavedScheduleSets) =>
                    Object.fromEntries(
                        Object.keys(compactSavedScheduleSets).map((scheduleType) => [
                            scheduleType,
                            compactSavedScheduleSets[scheduleType as ScheduleType]!.map(
                                (compactScheduleSet) =>
                                    compactScheduleSet.map((scheduleHeader) => ({
                                        id: scheduleHeader[0],
                                        name: scheduleHeader[1]
                                    }))
                            )
                        ])
                    )
                )
                .pipe(savedScheduleSetsSchema)
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
        console.error('failed to read schedule set cookie', err);
        return {};
    }
};

export const readPreferredScheduleViewCookie = (ctx: RequestEvent) =>
    scheduleViewSchema.safeParse(ctx.cookies.get(COOKIE.PREFERRED_SCHEDULE_VIEW)).data;

export const readPickerState = (ctx: RequestEvent) => {
    try {
        return z
            .string()
            .base64()
            .transform((value) => atob(value).split('.'))
            .pipe(
                z
                    .tuple([z.coerce.number().pipe(scheduleSelectedPeriodSchema)])
                    .rest(scheduleIdSchema)
            )
            .transform(([periodIndex, ...scheduleIds]) => ({ periodIndex, scheduleIds }))
            .pipe(pickerStateSchema)
            .parse(ctx.url.searchParams.get(SEARCH_PARAM.PICKER.STATE));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
        return null;
    }
};

export const isMobileBasedOnRequestHeaders = (ctx: RequestEvent) => {
    const secUAMobile = ctx.request.headers.get('Sec-CH-UA-Mobile');
    if (secUAMobile) {
        return secUAMobile === '?1';
    }

    const userAgent = ctx.request.headers.get('User-Agent');
    if (!userAgent) {
        return false;
    }

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

export const areCookiesEnabled = (cookieConsentState: CookieConsentState) => {
    return cookieConsentState.version >= CURRENT_COOKIE_CONSENT_VERSION;
};

export const assertCookiesAreEnabled = (cookieConsentState: CookieConsentState) => {
    if (!areCookiesEnabled(cookieConsentState)) {
        error(400, 'Cookies are not allowed');
    }
};

export const redirectAfterFormActionComplete = (ctx: RequestEvent) => {
    const redirectUrl = new URL(ctx.url);
    redirectUrl.search = '';
    redirect(303, redirectUrl);
};
