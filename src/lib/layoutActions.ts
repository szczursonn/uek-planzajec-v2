import type { Actions, RequestEvent } from '@sveltejs/kit';
import {
    readCookieConsentStateCookie,
    redirectAfterFormActionComplete
} from '$lib/server/serverUtils';
import { encodeCookieConsentState } from '$lib/storeUtils';
import {
    COOKIE,
    COOKIE_CONFIG,
    CURRENT_COOKIE_CONSENT_VERSION,
    REJECTED_COOKIE_CONSENT_VERSION
} from '$lib/consts';
import type { CookieConsentState } from '$lib/types';

const setCookieConsentStateCookie = (ctx: RequestEvent, cookieConsentState: CookieConsentState) => {
    ctx.cookies.set(
        COOKIE.COOKIE_CONSENT_STATE,
        encodeCookieConsentState(cookieConsentState),
        COOKIE_CONFIG
    );
};

export const layoutActions = {
    cookieAccept(ctx) {
        setCookieConsentStateCookie(ctx, {
            version: CURRENT_COOKIE_CONSENT_VERSION,
            forceShowNotice: false
        });

        redirectAfterFormActionComplete(ctx);
    },
    cookieReject(ctx) {
        setCookieConsentStateCookie(ctx, {
            version: REJECTED_COOKIE_CONSENT_VERSION,
            forceShowNotice: false
        });
        ctx.cookies.delete(COOKIE.SAVED_SCHEDULES, COOKIE_CONFIG);
        ctx.cookies.delete(COOKIE.PREFERRED_SCHEDULE_VIEW, COOKIE_CONFIG);

        redirectAfterFormActionComplete(ctx);
    },
    showCookieNotice(ctx) {
        const cookieConsentState = readCookieConsentStateCookie(ctx);
        setCookieConsentStateCookie(ctx, {
            ...cookieConsentState,
            forceShowNotice: true
        });

        redirectAfterFormActionComplete(ctx);
    }
} as const satisfies Actions;
