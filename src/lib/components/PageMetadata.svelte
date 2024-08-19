<script lang="ts">
    import { appTitle } from '$lib/paraglide/messages';

    const {
        titleSegments,
        description,
        noIndexNoFollow = false
    }: { titleSegments: unknown[]; description?: string; noIndexNoFollow?: boolean } = $props();

    const documentTitle = $derived([...titleSegments, appTitle()].filter(Boolean).join(' | '));
</script>

<svelte:head>
    <title>{documentTitle}</title>
    <meta property="og:title" content={documentTitle} />
    {#if description}
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
    {/if}
    {#if noIndexNoFollow}
        <meta name="robots" content="noindex, nofollow" />
    {/if}
</svelte:head>
