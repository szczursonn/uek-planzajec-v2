<script lang="ts" module>
    const DEFAULT_CLASS = 'border-2 border-zinc-300 bg-black';
    const RESOLVED_ITEM_TYPE_TO_CLASS = {
        lecture: 'bg-sky-600',
        exercise: 'bg-amber-600',
        language: 'bg-green-600',
        seminar: 'bg-indigo-700',
        exam: 'bg-red-500',
        cancelled: DEFAULT_CLASS
    } as const satisfies Record<ResolvedExtendedScheduleItemType, string>;
</script>

<script lang="ts">
    import { languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import type {
        ExtendedScheduleItem,
        ResolvedExtendedScheduleItemType,
        ScheduleItem,
        ScheduleViewComponentProps
    } from '$lib/types';
    import { UEK_TIME_ZONE } from '$lib/consts';
    import { getLocalDateParts } from '$lib/dateUtils';
    import { createMoodleURL } from '$lib/linkUtils';
    import { getGlobalContext } from '$lib/stores/globalContext';
    import Icon from '$lib/components/Icon.svelte';
    import moodleLecturerLinkIcon from '$lib/assets/moodleLecturerLinkIcon.jpg';
    import { getRelativeTimeLabel } from '$lib/utils';

    const { nowStore } = getGlobalContext();

    const { extendedAggregateSchedule }: ScheduleViewComponentProps = $props();

    const sortedItemGroups = $derived.by(() => {
        if (extendedAggregateSchedule.items.length === 0) {
            return [];
        }

        const currentDateParts = getLocalDateParts($nowStore);
        const hasMultipleYears =
            extendedAggregateSchedule.items[0]!.startParts[0] !==
            extendedAggregateSchedule.items.at(-1)!.startParts[0];

        const monthHeaderFormatter = new Intl.DateTimeFormat(languageTag(), {
            timeZone: UEK_TIME_ZONE,
            month: 'long',
            year: hasMultipleYears ? 'numeric' : undefined
        });

        const dayOfWeekFormatter = new Intl.DateTimeFormat(languageTag(), {
            timeZone: UEK_TIME_ZONE,
            weekday: 'short'
        });

        const monthGroups = [] as {
            monthHeader: string;
            dayGroups: {
                dayOfMonth: number;
                dayOfWeek: string;
                isCurrent: boolean;
                items: ExtendedScheduleItem[];
            }[];
        }[];

        let previousItem: ScheduleItem | undefined;
        for (const item of extendedAggregateSchedule.items) {
            if (
                item.startParts[0] !== previousItem?.startParts[0] ||
                item.startParts[1] !== previousItem?.startParts[1] ||
                item.startParts[2] !== previousItem?.startParts[2]
            ) {
                if (
                    item.startParts[0] !== previousItem?.startParts[0] ||
                    item.startParts[1] !== previousItem?.startParts[1]
                ) {
                    monthGroups.push({
                        monthHeader: monthHeaderFormatter.format(item.startDate),
                        dayGroups: []
                    });
                }

                monthGroups.at(-1)!.dayGroups.push({
                    dayOfMonth: item.startParts[2],
                    dayOfWeek: dayOfWeekFormatter.format(item.startDate),
                    isCurrent:
                        item.startParts[0] === currentDateParts[0] &&
                        item.startParts[1] === currentDateParts[1] &&
                        item.startParts[2] === currentDateParts[2],
                    items: []
                });
                previousItem = item;
            }

            monthGroups.at(-1)!.dayGroups.at(-1)!.items.push(item);
        }

        return monthGroups;
    });
</script>

<ul>
    {#each sortedItemGroups as monthGroup}
        <li>
            <div
                class="bg-gradient-to-t from-blue-500 to-violet-500 py-2 pl-2 text-xl font-semibold capitalize text-white sm:py-4 sm:pl-4 sm:text-2xl"
            >
                {monthGroup.monthHeader}
            </div>
            <ul class="divide-y-2 divide-accent-default">
                {#each monthGroup.dayGroups as dayGroup}
                    <li class="grid grid-cols-12 gap-x-2">
                        <div class="col-span-2 m-4 flex flex-col items-center lg:col-span-1">
                            <span
                                class={`flex h-10 w-10 items-center justify-center text-2xl font-bold sm:h-12 sm:w-12 sm:text-3xl${dayGroup.isCurrent ? ' rounded-full bg-gradient-to-t from-blue-500 to-violet-500' : ''}`}
                            >
                                {dayGroup.dayOfMonth}
                            </span>
                            <span class="text-sm sm:text-base">{dayGroup.dayOfWeek}</span>
                        </div>
                        <ul class="col-span-10 lg:col-span-11">
                            {#each dayGroup.items as item}
                                <li
                                    class={`relative my-4 grid grid-cols-12 items-center gap-y-0.5 sm:items-start${(item.isFinished && extendedAggregateSchedule.period === 'upcoming') || item.resolvedType === 'cancelled' ? ' opacity-80 transition-opacity hover:opacity-100' : ''}`}
                                >
                                    {#if item.isInProgress || item.isFirstUpcoming}
                                        <div
                                            class={`${item.isInProgress ? 'animate-pulse ' : ''}pointer-events-none absolute -left-3 bottom-0 h-full border-l-4 border-accent-default`}
                                            aria-hidden="true"
                                        ></div>
                                        <span
                                            class={`${item.isInProgress ? 'animate-pulse ' : ''}col-span-full my-0.5 font-bold text-accent first-letter:capitalize lg:my-1 lg:text-lg`}
                                        >
                                            {#if item.isInProgress}
                                                {m.scheduleItemInProgress()}
                                            {:else}
                                                {getRelativeTimeLabel(item.startDate, $nowStore)}
                                            {/if}
                                        </span>
                                    {/if}

                                    <span
                                        class="col-span-full flex flex-row items-center gap-2 text-sm lg:col-span-2"
                                    >
                                        <div
                                            class={`${item.resolvedType ? RESOLVED_ITEM_TYPE_TO_CLASS[item.resolvedType] : DEFAULT_CLASS} h-4 w-4 rounded-full sm:h-5 sm:w-5`}
                                            aria-hidden="true"
                                        ></div>
                                        <span
                                            class={item.resolvedType === 'cancelled'
                                                ? 'line-through'
                                                : ''}
                                        >
                                            {item.hourRangeLabel}
                                        </span>
                                    </span>
                                    <div class="col-span-full flex flex-col gap-0.5 lg:col-span-10">
                                        <div class="text-sm font-bold">
                                            <span
                                                class="text-sm font-semibold sm:text-base md:text-lg"
                                            >
                                                {[item.subject, item.type]
                                                    .filter(Boolean)
                                                    .join(' - ')}
                                            </span>
                                        </div>

                                        {#each item.lecturers as lecturer}
                                            <div class="flex items-center gap-1.5 text-xs">
                                                {#if lecturer.moodleId}
                                                    <a
                                                        class="h-full w-3 text-accent hover:underline"
                                                        href={createMoodleURL(lecturer.moodleId)}
                                                        title={m.moodleLinkTitle({
                                                            lecturerName: lecturer.name ?? ''
                                                        })}
                                                        target="_blank"
                                                        rel="noopener"
                                                        data-no-translate
                                                    >
                                                        <img
                                                            src={moodleLecturerLinkIcon}
                                                            alt={m.moodleLinkTitle({
                                                                lecturerName: lecturer.name ?? ''
                                                            })}
                                                        />
                                                    </a>
                                                {:else}
                                                    <Icon
                                                        iconName="person"
                                                        class="h-3 w-3"
                                                        ariaHidden
                                                    />
                                                {/if}
                                                <span>{lecturer.name}</span>
                                            </div>
                                        {/each}

                                        {#if item.room && !item.room.url}
                                            <span class="flex items-center gap-1.5 text-xs">
                                                <Icon
                                                    class="mb-0.5 h-3 w-3"
                                                    iconName="pin"
                                                    ariaHidden
                                                />
                                                <span>{item.room.name}</span>
                                            </span>
                                        {/if}

                                        {#if extendedAggregateSchedule.headers.length > 1 || extendedAggregateSchedule.type !== 'group' || item.groups.length > 1}
                                            <span class="flex items-center gap-1.5 text-xs">
                                                <Icon
                                                    class="max-h-3 max-w-3"
                                                    iconName="bookmarkOutline"
                                                    ariaHidden
                                                />
                                                <span>{item.groups.join(', ')}</span>
                                            </span>
                                        {/if}

                                        {#if item.room?.url}
                                            <div class="flex">
                                                <a
                                                    href={item.room.url}
                                                    target="_blank"
                                                    rel="noopener"
                                                    title={item.room.name}
                                                    data-no-translate
                                                    class="mt-1 rounded-lg border border-tertiary bg-primary px-4 py-2 text-sm transition-colors first-letter:capitalize hover:border-accent-default hover:underline focus:border-accent-default focus:underline"
                                                >
                                                    {item.room.name}
                                                </a>
                                            </div>
                                        {/if}

                                        {#if item.extra}
                                            <hr class=" mt-1 border-secondary" />
                                            <span class="text-error">{item.extra}</span>
                                        {/if}
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </li>
                {/each}
            </ul>
        </li>
    {/each}
</ul>
