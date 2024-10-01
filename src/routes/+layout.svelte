<script lang="ts">
    import '../app.css';
    import { ParaglideJS } from '@inlang/paraglide-sveltekit';
    import { availableLanguageTags, languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import { page, navigating } from '$app/stores';
    import { i18n } from '$lib/i18n';
    import { initializeGlobalContext } from '$lib/stores';
    import { REPO_URL } from '$lib/consts';
    import { createOriginalURL, createSchedulePickerURL } from '$lib/utils';
    import PageNavigationProgressBar from '$lib/components/PageNavigationProgressBar.svelte';
    import SvgIcon from '$lib/components/SvgIcon.svelte';
    import uekLogo from '$lib/assets/uekLogo.svg';

    const LANGUAGE_TAG_TO_ICON = {
        pl: 'langFlagPL',
        en: 'langFlagEN'
    } as const;

    const { children, data } = $props();
    initializeGlobalContext({ now: new Date(data.now), favoriteSchedules: data.favoriteSchedules });
</script>

<svelte:head>
    <meta property="og:site_name" content={m.appTitle()} />
    <meta property="og:type" content="website" />
    <link rel="author" href="https://github.com/szczursonn" />
</svelte:head>
<ParaglideJS {i18n}>
    <div
        class={`flex min-h-screen flex-col items-center bg-primary font-inter text-primary ${$navigating ? '*:!cursor-progress' : ''}`}
    >
        <PageNavigationProgressBar />
        <div class="flex w-11/12 flex-col items-center 2xl:w-5/6 3xl:w-3/4">
            <header class="mb-4 mt-8">
                <a
                    class="flex items-center gap-4 transition-opacity hover:opacity-80"
                    href={createSchedulePickerURL()}
                    title={m.appTitle()}
                >
                    <img class="w-28 sm:w-32" src={uekLogo} alt="UEK Logo" fetchpriority="high" />
                    <span class="text-xl font-bold capitalize sm:text-3xl">{m.appTitle()}</span>
                </a>
            </header>
            <main class="mb-auto w-full">
                {@render children()}
            </main>
            <footer
                class="my-8 flex w-full flex-col items-center gap-4 border-t border-t-secondary pt-4"
            >
                <div class="text-center">
                    <span>{m.footerUnofficialDisclosure()}</span>
                    <a
                        class="font-semibold text-accent hover:underline"
                        href={createOriginalURL().toString()}
                        title={m.officialClassScheduleLinkTitle()}
                        target="_blank"
                        rel="noopener"
                    >
                        {m.officialClassScheduleLinkTitle()}
                    </a>
                </div>

                <div class="flex gap-4">
                    {#each availableLanguageTags.filter((lang) => lang !== languageTag()) as lang}
                        <a
                            class="shadow-xl transition-shadow hover:shadow-accent focus:shadow-accent"
                            data-no-translate
                            href={i18n.resolveRoute(i18n.route($page.url.pathname), lang) +
                                $page.url.search}
                            hreflang={lang}
                            title={m.changeLanguageToSelf(
                                {},
                                {
                                    languageTag: lang
                                }
                            )}
                        >
                            <SvgIcon class="h-5 w-8" iconName={LANGUAGE_TAG_TO_ICON[lang]} />
                        </a>
                    {/each}
                </div>

                <a
                    class="mt-4 opacity-30 transition-opacity hover:opacity-45"
                    href={REPO_URL}
                    target="_blank"
                    rel="noopener"
                    title="GitHub"
                >
                    <SvgIcon class="h-12 w-12" iconName="githubLogo" />
                </a>
            </footer>
        </div>
    </div>
</ParaglideJS>
