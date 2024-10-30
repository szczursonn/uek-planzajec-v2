<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { ParaglideJS } from '@inlang/paraglide-sveltekit';
    import { invalidateAll } from '$app/navigation';
    import { languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import { i18n } from '$lib/i18n';
    import { setGlobalContext } from '$lib/stores/globalContext';
    import PageMetadata from '$lib/components/PageMetadata.svelte';
    import PageProgressBar from '$lib/components/layout/PageProgressBar.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import PageFooter from '$lib/components/layout/PageFooter.svelte';
    import PageCookieBanner from '$lib/components/layout/PageCookieBanner.svelte';
    import PageSnackbar from '$lib/components/layout/PageSnackbar.svelte';

    const { children, data } = $props();
    const globalContext = setGlobalContext({
        initialNow: new Date(data.initialNowAsNumber),
        initialCookieConsentState: data.initialCookieConsentState,
        initialSavedScheduleSets: data.initialSavedScheduleSets,
        initialPreferredScheduleView: data.initialPreferredScheduleView
    });

    onMount(() => {
        let lastDataUpdate = Date.now();
        let dataUpdateTimeout: ReturnType<typeof setTimeout> | undefined;

        const startDataUpdateTimeout = () => {
            if (!dataUpdateTimeout) {
                dataUpdateTimeout = setTimeout(
                    () => {
                        invalidateAll();
                        lastDataUpdate = Date.now();
                    },
                    Math.max(lastDataUpdate + 5 * 60 * 1000 - Date.now(), 0)
                );
            }
        };
        const stopDataUpdateTimeout = () => {
            if (dataUpdateTimeout) {
                clearTimeout(dataUpdateTimeout);
                dataUpdateTimeout = undefined;
            }
        };
        startDataUpdateTimeout();

        const visibilityChangeEventHandler = () => {
            if (document.visibilityState === 'visible') {
                startDataUpdateTimeout();
            } else {
                stopDataUpdateTimeout();
            }
        };
        document.addEventListener('visibilitychange', visibilityChangeEventHandler);

        return () => {
            globalContext.nowStore.cleanup();
            globalContext.savedScheduleSetsStore.cleanup();
            globalContext.preferredScheduleViewStore.cleanup();
            globalContext.cookieStore.cleanup();
            globalContext.snackbarStore.cleanup();
            document.removeEventListener('visibilitychange', visibilityChangeEventHandler);
            stopDataUpdateTimeout();
        };
    });
</script>

<ParaglideJS {i18n}>
    <PageMetadata>
        <meta property="og:site_name" content={m.appTitle()} />
        <meta property="og:type" content="website" />
        <link rel="author" href="https://github.com/szczursonn" />
        <link rel="manifest" href={`/manifest-${languageTag()}.webmanifest`} />
    </PageMetadata>
    <div class="flex min-h-screen flex-col items-center bg-primary font-inter text-primary">
        <PageProgressBar />
        <PageSnackbar />
        <div class="flex w-11/12 flex-col items-center 2xl:w-5/6 3xl:w-3/4">
            <PageHeader />
            <main class="mb-auto w-full">
                {@render children()}
            </main>
            <PageFooter />
        </div>
        <PageCookieBanner />
    </div>
</ParaglideJS>
