<script lang="ts">
    import { page } from '$app/stores';
    import * as m from '$lib/paraglide/messages';
    import type { ScheduleHeader, ScheduleViewComponentProps } from '$lib/types';

    const { extendedAggregateSchedule }: ScheduleViewComponentProps = $props();

    const createIcalUrl = $derived((headers: ScheduleHeader[]) => {
        return `${$page.url.origin}/ical/${encodeURIComponent(extendedAggregateSchedule.type)}/${headers.map((header) => encodeURIComponent(header.id)).join('/')}`;
    });
</script>

{#snippet codeblock({ text }: { text: string })}
    <code class="rounded-md bg-secondary p-1 text-xs sm:text-sm lg:text-base">
        {text}
    </code>
{/snippet}

<div class="my-12 flex flex-col items-center gap-y-2 text-center">
    <span>{m.useThisLinkForGoogleCalendarMessage()}</span>
    {@render codeblock({
        text: createIcalUrl(extendedAggregateSchedule.headers)
    })}

    {#if extendedAggregateSchedule.headers.length > 1}
        <span>{m.youCanAlsoSeperateLinksForGoogleCalendar()}</span>
        {#each extendedAggregateSchedule.headers as header}
            <span>
                <span>{header.name}: </span>
                {@render codeblock({
                    text: createIcalUrl([header])
                })}
            </span>
        {/each}
    {/if}

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
