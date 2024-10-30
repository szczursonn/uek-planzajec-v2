<script lang="ts">
    import type { Snippet } from 'svelte';
    import { appTitle } from '$lib/paraglide/messages';

    const {
        titleParts,
        description,
        disallowRobots = false,
        children
    }: {
        titleParts?: unknown[];
        description?: string;
        disallowRobots?: boolean;
        children?: Snippet<[]>;
    } = $props();

    const documentTitle = $derived([...(titleParts ?? []), appTitle()].filter(Boolean).join(' | '));
</script>

<svelte:head>
    {#if titleParts}
        <title>{documentTitle}</title>
        <meta property="og:title" content={documentTitle} />
    {/if}
    {#if description}
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
    {/if}
    {#if disallowRobots}
        <meta name="robots" content="noindex, nofollow" />
    {/if}
    {#if children}
        {@render children()}
    {/if}
</svelte:head>
