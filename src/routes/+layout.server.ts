import {
    isMobileBasedOnRequestHeaders,
    readCookieConsentStateCookie,
    readPreferredScheduleViewCookie,
    readSavedScheduleSetsCookie
} from '$lib/server/serverUtils';
import { COOKIE, COOKIE_CONFIG, DEFAULT_SCHEDULE_VIEW } from '$lib/consts';

export const load = async (ctx) => {
    // refresh expiration date of all existing cookies
    for (const cookieName of Object.values(COOKIE)) {
        const cookieValue = ctx.cookies.get(cookieName);
        if (cookieValue) {
            ctx.cookies.set(cookieName, cookieValue, COOKIE_CONFIG);
        }
    }

    // clear legacy cookies
    for (const legacyCookieName of ['UEK-FAV', 'UEK-VIEW']) {
        if (ctx.cookies.get(legacyCookieName)) {
            ctx.cookies.delete(legacyCookieName, COOKIE_CONFIG);
        }
    }

    return {
        initialNowAsNumber: new Date().getTime(),
        initialCookieConsentState: readCookieConsentStateCookie(ctx),
        initialSavedScheduleSets: readSavedScheduleSetsCookie(ctx),
        initialPreferredScheduleView:
            readPreferredScheduleViewCookie(ctx) ??
            (isMobileBasedOnRequestHeaders(ctx)
                ? DEFAULT_SCHEDULE_VIEW.MOBILE
                : DEFAULT_SCHEDULE_VIEW.DESKTOP)
    };
};
