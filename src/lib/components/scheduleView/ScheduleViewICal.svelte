<script lang="ts">
    import { page } from '$app/stores';
    import * as m from '$lib/paraglide/messages';
    import type { ScheduleViewComponentProps } from '$lib/types';

    const { headers, scheduleType }: ScheduleViewComponentProps = $props();
</script>

<div class="my-12 flex flex-col items-center gap-y-2 text-center">
    <span>{m.useTheseLinksForGoogleCalendar()}</span>
    {#each headers as header}
        <div>
            <span>{header.name}:</span>
            <code class="rounded-md bg-secondary p-1">
                {`${$page.url.protocol}${$page.url.host}/ical/${scheduleType}/${header.id}`}
            </code>
        </div>
    {/each}
    <a
        href="https://support.google.com/calendar/answer/37100"
        title={m.howToAddToGoogleCalendar()}
        target="_blank"
        rel="noopener"
        class="text-accent hover:underline"
    >
        {m.howToAddToGoogleCalendar()}
    </a>
</div>
