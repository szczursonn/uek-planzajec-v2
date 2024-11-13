<script lang="ts" module>
    const LANGUAGE_TAG_TO_ICON = {
        pl: 'langFlagPL',
        en: 'langFlagEN'
    } as const;
</script>

<script lang="ts">
    import { onMount } from 'svelte';
    import { gitHash } from 'virtual:version-info';
    import { page } from '$app/stores';
    import { availableLanguageTags, languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import { i18n } from '$lib/i18n';
    import { createOriginalURL } from '$lib/linkUtils';
    import { getGlobalContext } from '$lib/stores/globalContext';
    import Icon from '$lib/components/Icon.svelte';

    const { cookieStore } = getGlobalContext();

    // page store is not fully updated on shallow navigation
    let currentUrl = $state($page.url);
    onMount(() =>
        page.subscribe(() => {
            const actualCurrentUrl = new URL(window.location.href);
            if (currentUrl.toString() !== actualCurrentUrl.toString()) {
                currentUrl = actualCurrentUrl;
            }
        })
    );
</script>

{#snippet seperatorColumn()}
    <div class="h-12 w-1 border-l border-secondary py-10"></div>
{/snippet}

<footer class="my-8 flex w-full flex-col items-center gap-4 border-t border-t-secondary pt-4">
    <div class="flex flex-col text-center sm:block">
        <span>{m.footerUnofficialDisclosure()}</span>
        <a
            class="font-semibold text-accent hover:underline"
            href={createOriginalURL().toString()}
            title={m.officialClassScheduleLinkTitle()}
            target="_blank"
            rel="noopener"
            data-no-translate
        >
            {m.officialClassScheduleLinkTitle()}
        </a>
    </div>

    <div class="flex items-center gap-2 sm:gap-10 md:gap-20">
        <div class="flex items-center gap-2">
            {#each availableLanguageTags as lang}
                <a
                    class="shadow-xl transition-shadow hover:shadow-accent focus:shadow-accent"
                    data-no-translate
                    href={i18n.resolveRoute(i18n.route(currentUrl.pathname), lang) +
                        currentUrl.search}
                    hreflang={lang}
                    aria-current={lang === languageTag()}
                    title={m.changeLanguageToSelf(
                        {},
                        {
                            languageTag: lang
                        }
                    )}
                    onclick={(e) => {
                        if (lang === languageTag()) {
                            e.preventDefault();
                        }
                    }}
                >
                    <Icon class="h-5 w-8" iconName={LANGUAGE_TAG_TO_ICON[lang]} />
                </a>
            {/each}
        </div>

        {@render seperatorColumn()}

        <div class="flex flex-col items-center gap-1">
            <a
                class="opacity-30 transition-opacity hover:opacity-70"
                href="https://github.com/szczursonn/uek-planzajec-v2"
                target="_blank"
                rel="noopener"
                title="GitHub"
                data-no-translate
            >
                <Icon class="h-12 w-12" iconName="githubLogo" />
            </a>
            {#if gitHash}
                <code class="text-xs text-secondary">
                    {gitHash}
                </code>
            {/if}
        </div>

        {@render seperatorColumn()}

        <form
            method="POST"
            action="?/showCookieNotice"
            onsubmit={(e) => {
                e.preventDefault();
                cookieStore.forceShowNotice();
            }}
        >
            <button class="hover:underline" type="submit">{m.cookiePreferences()}</button>
        </form>
    </div>
</footer>
