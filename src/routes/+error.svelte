<script lang="ts">
    import { page } from '$app/stores';
    import * as m from '$lib/paraglide/messages';
    import { createOriginalURL } from '$lib/linkUtils';
    import Icon from '$lib/components/Icon.svelte';
    import PageMetadata from '$lib/components/PageMetadata.svelte';
</script>

<PageMetadata titleParts={[$page.error?.message ?? $page.status]} />
<div
    class="my-8 flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg bg-error p-4 text-center text-error"
>
    <Icon class="h-8 w-8" iconName="alert" />
    <span class="font-medium">{m.unexpectedErrorMessage()}</span>
    <span class="text-sm">{$page.error?.message ?? $page.status}</span>
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
