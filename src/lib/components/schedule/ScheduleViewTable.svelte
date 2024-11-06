<script lang="ts" module>
    const TABLE_HEAD_CELL_CLASS = 'p-1 sm:p-2';
    const TABLE_CELL_BASE_CLASS = 'max-w-96 p-1 sm:p-2';
</script>

<script lang="ts">
    import { languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import type { ScheduleViewComponentProps } from '$lib/types';
    import { UEK_TIME_ZONE } from '$lib/consts';
    import { getLocalDateParts } from '$lib/dateUtils';
    import { createMoodleURL } from '$lib/linkUtils';
    import moodleLecturerLinkIcon from '$lib/assets/moodleLecturerLinkIcon.jpg';
    import { getGlobalContext } from '$lib/stores/globalContext';
    import Icon from '$lib/components/Icon.svelte';

    const { nowStore } = getGlobalContext();

    const { extendedAggregateSchedule }: ScheduleViewComponentProps = $props();

    const extendedScheduleItems = $derived.by(() => {
        const currentDateParts = getLocalDateParts($nowStore);
        const itemDateFormatter = new Intl.DateTimeFormat(languageTag(), {
            timeZone: UEK_TIME_ZONE,
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'short'
        });

        return extendedAggregateSchedule.items.map((item) => {
            const itemStartDateParts = getLocalDateParts(item.startDate);

            return {
                ...item,
                dateLabel: itemDateFormatter.formatRange(item.startDate, item.endDate),
                isCurrentDay:
                    currentDateParts.day === itemStartDateParts.day &&
                    currentDateParts.month === itemStartDateParts.month &&
                    currentDateParts.year === itemStartDateParts.year
            };
        });
    });

    const shouldShowColumn = $derived({
        group:
            extendedAggregateSchedule.headers.length > 1 ||
            extendedAggregateSchedule.type !== 'group',
        lecturer:
            extendedAggregateSchedule.headers.length > 1 ||
            extendedAggregateSchedule.type !== 'lecturer',
        room:
            extendedAggregateSchedule.headers.length > 1 ||
            extendedAggregateSchedule.type !== 'room',
        extra: extendedAggregateSchedule.items.some((item) => item.extra)
    });
</script>

<table class="w-full break-all text-left sm:break-normal">
    <thead
        class="border-b-2 border-b-secondary text-xxs font-bold text-secondary sm:text-base md:text-lg"
    >
        <tr>
            <th class={TABLE_HEAD_CELL_CLASS}>
                <div class="flex items-center gap-1.5">
                    <Icon class="max-h-4 max-w-4" iconName="clock" ariaHidden />
                    <span>{m.scheduleViewTableColumnDate()}</span>
                </div>
            </th>
            <th class={TABLE_HEAD_CELL_CLASS}>{m.scheduleViewTableColumnSubject()}</th>
            <th class={TABLE_HEAD_CELL_CLASS}>{m.scheduleViewTableColumnType()}</th>
            {#if shouldShowColumn.group}
                <th class={TABLE_HEAD_CELL_CLASS}>{m.scheduleViewTableColumnGroup()}</th>
            {/if}
            {#if shouldShowColumn.lecturer}
                <th class={TABLE_HEAD_CELL_CLASS}>
                    <div class="flex items-center gap-1.5">
                        <Icon class="max-h-4 max-w-4" iconName="person" ariaHidden />
                        <span>{m.scheduleViewTableColumnLecturer()}</span>
                    </div>
                </th>
            {/if}
            {#if shouldShowColumn.room}
                <th class={TABLE_HEAD_CELL_CLASS}>
                    <div class="flex items-center gap-1.5">
                        <Icon class="max-h-4 max-w-4" iconName="pin" ariaHidden />
                        <span>
                            {m.scheduleViewTableColumnRoom()}
                        </span>
                    </div>
                </th>
            {/if}
            {#if shouldShowColumn.extra}
                <th class={TABLE_HEAD_CELL_CLASS}>{m.scheduleViewTableColumnExtra()}</th>
            {/if}
        </tr>
    </thead>
    <tbody class="text-xxs sm:text-xs md:text-sm lg:text-base">
        {#each extendedScheduleItems as item}
            <tr
                class={`${(item.isFinished && extendedAggregateSchedule.period === 'upcoming') || item.resolvedType === 'cancelled' ? ' text-secondary' : ''}${item.isInProgress ? ' border-2 border-accent-highlight' : ' border-b border-b-tertiary'}`}
            >
                <td class={TABLE_CELL_BASE_CLASS}>
                    {item.dateLabel}
                </td>
                <td class={TABLE_CELL_BASE_CLASS}>{item.subject || '-'}</td>
                <td class={`${TABLE_CELL_BASE_CLASS} capitalize`}>{item.type}</td>
                {#if shouldShowColumn.group}
                    <td class={TABLE_CELL_BASE_CLASS}>{item.groups.join(', ')}</td>
                {/if}
                {#if shouldShowColumn.lecturer}
                    <td class={`${TABLE_CELL_BASE_CLASS} flex flex-wrap items-center gap-2`}>
                        {#each item.lecturers as lecturer}
                            <span>{lecturer.name}</span>
                            {#if lecturer.moodleId}
                                <a
                                    class="h-1.5 w-2 text-accent hover:underline sm:h-3 sm:w-4"
                                    href={createMoodleURL(lecturer.moodleId)}
                                    title={m.moodleLinkTitle({
                                        lecturerName: lecturer.name ?? ''
                                    })}
                                    target="_blank"
                                    rel="noopener"
                                >
                                    <img
                                        src={moodleLecturerLinkIcon}
                                        alt={m.moodleLinkTitle({
                                            lecturerName: lecturer.name ?? ''
                                        })}
                                    />
                                </a>
                            {/if}
                        {/each}
                    </td>
                {/if}
                {#if shouldShowColumn.room}
                    <td class={TABLE_CELL_BASE_CLASS}>
                        {#if item.room?.url}
                            <a
                                class="text-accent hover:underline"
                                href={item.room.url}
                                title={item.room.name}
                                target="_blank"
                                rel="noopener"
                            >
                                {item.room.name}
                            </a>
                        {:else}
                            {item.room?.name || '-'}
                        {/if}
                    </td>
                {/if}
                {#if shouldShowColumn.extra}
                    <td class={`${TABLE_CELL_BASE_CLASS} text-error`}>{item.extra}</td>
                {/if}
            </tr>
        {/each}
    </tbody>
</table>
