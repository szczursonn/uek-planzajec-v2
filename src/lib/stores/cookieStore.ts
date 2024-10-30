import { writable } from 'svelte/store';
import { serialize as serializeCookie } from 'cookie';
import {
    COOKIE,
    COOKIE_CONFIG,
    CURRENT_COOKIE_CONSENT_VERSION,
    REJECTED_COOKIE_CONSENT_VERSION
} from '$lib/consts';
import type { CookieConsentState } from '$lib/types';
import { createStoreTabSyncer, encodeCookieConsentState } from '$lib/storeUtils';

export const createCookieStore = (initialCookieConsentState: CookieConsentState) => {
    const { subscribe, update } = writable({
        consentState: structuredClone(initialCookieConsentState),
        isOutdatedConsentVersion() {
            return (
                this.consentState.version < CURRENT_COOKIE_CONSENT_VERSION &&
                this.consentState.version !== REJECTED_COOKIE_CONSENT_VERSION
            );
        },
        areCookiesAllowed() {
            return this.consentState.version >= CURRENT_COOKIE_CONSENT_VERSION;
        },
        shouldShowNotice() {
            return this.consentState.forceShowNotice || this.isOutdatedConsentVersion();
        }
    });

    const storeTabSyncer = createStoreTabSyncer<CookieConsentState>(
        COOKIE.COOKIE_CONSENT_STATE,
        (newCookieConsentState) =>
            update((store) => {
                store.consentState = newCookieConsentState;
                return store;
            })
    );

    const setCookie = (key: string, value: string, ignoreUnallowed: boolean = false) => {
        // stupid!!!
        const unsubscribe = subscribe((store) => {
            if (store.areCookiesAllowed() || ignoreUnallowed) {
                document.cookie = serializeCookie(key, value, COOKIE_CONFIG);
            }
            setTimeout(() => unsubscribe(), 0);
        });
    };

    const clearCookie = (key: string) => {
        document.cookie = serializeCookie(key, '', {
            ...COOKIE_CONFIG,
            maxAge: 0
        });
    };

    const setCookieConsentState = (
        updateCallback: (currentCookieConsentState: CookieConsentState) => CookieConsentState
    ) =>
        update((store) => {
            store.consentState = updateCallback(store.consentState);
            setCookie(
                COOKIE.COOKIE_CONSENT_STATE,
                encodeCookieConsentState(store.consentState),
                true
            );
            storeTabSyncer.notifyChange(store.consentState);

            return store;
        });

    return {
        subscribe,
        subscribeToCookiesAllowedChange(callback: (areCookieAllowed: boolean) => void) {
            let previousAreCookiesAllowed: boolean | undefined;
            return subscribe((store) => {
                const newAreCookiesAllowed = store.areCookiesAllowed();
                if (
                    previousAreCookiesAllowed !== undefined &&
                    previousAreCookiesAllowed !== newAreCookiesAllowed
                ) {
                    callback(newAreCookiesAllowed);
                }
                previousAreCookiesAllowed = newAreCookiesAllowed;
            });
        },
        accept() {
            setCookieConsentState(() => ({
                version: CURRENT_COOKIE_CONSENT_VERSION,
                forceShowNotice: false
            }));
        },
        reject() {
            setCookieConsentState(() => ({
                version: REJECTED_COOKIE_CONSENT_VERSION,
                forceShowNotice: false
            }));
        },
        forceShowNotice() {
            setCookieConsentState((currentCookieConsentState) => ({
                ...currentCookieConsentState,
                forceShowNotice: true
            }));
        },
        setCookie,
        clearCookie,
        cleanup() {
            storeTabSyncer.cleanup();
        }
    };
};
