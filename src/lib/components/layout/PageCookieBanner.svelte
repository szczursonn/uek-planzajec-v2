<script lang="ts">
    import * as m from '$lib/paraglide/messages';
    import { getGlobalContext } from '$lib/stores/globalContext';
    import Button from '$lib/components/form/Button.svelte';

    const { cookieStore, snackbarStore } = getGlobalContext();
</script>

{#if $cookieStore.shouldShowNotice()}
    <div
        class="fixed bottom-0 z-40 flex w-full flex-col items-center justify-between gap-2 rounded border-t-4 border-accent-default bg-secondary p-8 shadow-2xl xl:bottom-[2%] xl:w-[96%] xl:flex-row xl:gap-8 xl:border"
    >
        <div>
            <div class="text-lg font-bold">
                {$cookieStore.isOutdatedConsentVersion()
                    ? m.cookieNoticeBannerTitleUpdated()
                    : m.cookieNoticeBannerTitle()}
            </div>
            <div>{m.cookieNoticeBannerMessage()}</div>
            {#if $cookieStore.areCookiesAllowed() || $cookieStore.isOutdatedConsentVersion()}
                <div class="text-warn">{m.cookieNoticeBannerDeleteWarningMessage()}</div>
            {/if}
        </div>
        <form
            class="flex h-min w-full gap-2 xl:max-w-[30%]"
            method="POST"
            onsubmit={(event) => {
                event.preventDefault();
                if ((event.submitter as HTMLButtonElement)?.formAction.endsWith('cookieAccept')) {
                    cookieStore.accept();
                    snackbarStore.show({
                        message: m.snackbarCookieAcceptMessage()
                    });
                } else {
                    cookieStore.reject();
                    snackbarStore.show({
                        message: m.snackbarCookieRejectMessage()
                    });
                }
            }}
        >
            <Button label={m.cookieNoticeAccept()} iconName="check" formaction="?/cookieAccept" />
            <Button
                label={m.cookieNoticeReject()}
                iconName="cross"
                variant="outline-secondary"
                formaction="?/cookieReject"
            />
        </form>
    </div>
{/if}
