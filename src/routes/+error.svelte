<script lang="ts">
    import { page } from '$app/stores';
    import {
        unexpectedErrorMessage,
        officialClassScheduleLinkTitle
    } from '$lib/paraglide/messages';
    import SvgIcon from '$lib/components/SvgIcon.svelte';
    import PageMetadata from '$lib/components/PageMetadata.svelte';
    import { createOriginalURL } from '$lib/utils';
</script>

<PageMetadata titleSegments={[$page.error?.message ?? $page.status]} />
<div
    class="my-8 flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg bg-error p-4 text-error"
>
    <SvgIcon class="h-8 w-8" iconName="alert" />
    <span class="font-medium">{unexpectedErrorMessage()}</span>
    <span class="text-sm">{$page.error?.message ?? $page.status}</span>
    <a
        class="font-semibold text-accent hover:underline"
        href={createOriginalURL().toString()}
        title={officialClassScheduleLinkTitle()}
        target="_blank"
        rel="noopener"
    >
        {officialClassScheduleLinkTitle()}
    </a>
</div>
