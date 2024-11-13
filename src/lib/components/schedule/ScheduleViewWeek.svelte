<script lang="ts" module>
    const DEFAULT_CLASS = 'bg-secondary border-gray-900 border-2';
    const RESOLVED_ITEM_TYPE_TO_CLASS = {
        lecture: 'bg-sky-800 border-sky-900',
        exercise: 'bg-amber-800 border-amber-900',
        language: 'bg-green-700 border-green-900',
        seminar: 'bg-indigo-700 border-indigo-900',
        exam: 'bg-red-700 border-red-900',
        cancelled: `${DEFAULT_CLASS} text-secondary`
    } as const satisfies Record<ResolvedExtendedScheduleItemType, string>;
</script>

<script lang="ts">
    import { languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import type {
        ExtendedScheduleItem,
        ResolvedExtendedScheduleItemType,
        ScheduleViewComponentProps
    } from '$lib/types';
    import { UEK_TIME_ZONE } from '$lib/consts';
    import {
        eachDatePartsBetween,
        getNextSunday,
        getPreviousMonday,
        getLocalDateParts,
        getDateFromLocalParts
    } from '$lib/dateUtils';
    import { createMoodleURL } from '$lib/linkUtils';
    import { getGlobalContext } from '$lib/stores/globalContext';
    import Icon from '$lib/components/Icon.svelte';
    import moodleLecturerLinkIcon from '$lib/assets/moodleLecturerLinkIcon.jpg';
    import { areDatePartsEqualWithoutTime, getRelativeTimeLabel } from '$lib/utils';

    const { nowStore } = getGlobalContext();

    const { extendedAggregateSchedule }: ScheduleViewComponentProps = $props();

    const dayGroups = $derived.by(() => {
        const groupLabelFormatter = new Intl.DateTimeFormat(languageTag(), {
            timeZone: UEK_TIME_ZONE,
            day: 'numeric',
            month: 'short',
            weekday: 'short'
        });

        const { startDate: periodStartDate, endDate: periodEndDate } =
            extendedAggregateSchedule.periodOptions.find(
                (periodOption) => periodOption.id === extendedAggregateSchedule.period
            )!;

        const dayGroups: {
            label: string;
            items: ExtendedScheduleItem[];
            isOutsideOfSelectedPeriod: boolean;
            isCurrent: boolean;
        }[] = [];

        const currentDateParts = getLocalDateParts($nowStore);

        let i = 0;
        for (const dateParts of eachDatePartsBetween(
            getLocalDateParts(
                getPreviousMonday(
                    new Date(
                        Math.min(
                            periodStartDate.getTime(),
                            extendedAggregateSchedule.items[0]!.startDate.getTime()
                        )
                    )
                )
            ),
            getLocalDateParts(
                getNextSunday(
                    new Date(
                        Math.max(
                            periodEndDate.getTime(),
                            extendedAggregateSchedule.items.at(-1)!.endDate.getTime()
                        )
                    )
                )
            )
        )) {
            const date = getDateFromLocalParts(dateParts);

            dayGroups.push({
                label: groupLabelFormatter.format(date),
                isOutsideOfSelectedPeriod:
                    date.getTime() < periodStartDate.getTime() ||
                    date.getTime() > periodEndDate.getTime(),
                isCurrent: areDatePartsEqualWithoutTime(dateParts, currentDateParts),
                items: []
            });

            while (i < extendedAggregateSchedule.items.length) {
                if (
                    !areDatePartsEqualWithoutTime(
                        extendedAggregateSchedule.items[i]!.startParts,
                        dateParts
                    )
                ) {
                    break;
                }

                dayGroups.at(-1)!.items.push(extendedAggregateSchedule.items[i]!);
                i++;
            }
        }

        return dayGroups;
    });
</script>

<ul class="grid grid-cols-1 gap-x-1 gap-y-4 sm:grid-cols-7 sm:gap-y-10 md:gap-x-2">
    {#each dayGroups as group}
        <li class={`flex-col gap-2 ${group.items.length === 0 ? 'hidden sm:flex' : 'flex'}`}>
            <span
                class={`sticky top-0 z-10 flex flex-col items-center truncate border-y-2 text-base sm:text-xs md:text-sm lg:text-base ${group.isCurrent ? 'border-accent-default bg-accent-default font-bold' : group.isOutsideOfSelectedPeriod ? 'border-secondary bg-primary italic text-secondary' : 'bg-primary'}`}
            >
                {group.label}
            </span>
            <ul class="flex flex-col gap-2">
                {#each group.items as item}
                    <li
                        class={`${item.resolvedType ? RESOLVED_ITEM_TYPE_TO_CLASS[item.resolvedType] : DEFAULT_CLASS}${item.isFinished && extendedAggregateSchedule.period === 'upcoming' ? ' opacity-80 transition-opacity hover:opacity-100' : ''} relative flex flex-col gap-y-[1px] rounded-lg border-2 p-3 text-xs sm:p-1.5 sm:text-xxs lg:p-3 lg:text-xs`}
                    >
                        {#if item.isInProgress || item.isFirstUpcoming}
                            <div
                                class={`${item.isInProgress ? 'animate-pulse ' : ''}pointer-events-none absolute -bottom-0.5 -left-0.5 flex h-[calc(100%+4px)] w-[calc(100%+4px)] justify-center rounded-lg border-4 border-accent-default`}
                            >
                                <div
                                    class="pointer-events-auto h-min w-full bg-accent-default py-1 text-center text-sm font-bold first-letter:capitalize"
                                >
                                    {#if item.isInProgress}
                                        {m.scheduleItemInProgress()}
                                    {:else}
                                        {getRelativeTimeLabel(item.startDate, $nowStore)}
                                    {/if}
                                </div>
                            </div>
                            <div class="mt-6"></div>
                        {/if}
                        <span class="text-sm font-bold sm:break-all sm:text-xs lg:break-normal">
                            {[item.subject, item.type].filter(Boolean).join(' - ')}
                        </span>
                        <div class="flex items-center gap-1.5">
                            <Icon
                                class="h-3 w-3 sm:h-2 sm:w-2 lg:h-3 lg:w-3"
                                iconName="clock"
                                ariaHidden
                            />
                            <span>{item.hourRangeLabel}</span>
                        </div>
                        {#if item.lecturers.length > 0}
                            <div class="flex flex-col">
                                {#each item.lecturers as lecturer}
                                    <div class="flex flex-wrap items-center gap-1.5">
                                        {#if lecturer.moodleId}
                                            <a
                                                class="w-3 text-accent hover:underline sm:w-2 lg:w-3"
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
                                                class="h-3 w-3 sm:h-2 sm:w-2 lg:h-3 lg:w-3"
                                                iconName="person"
                                                ariaHidden
                                            />
                                        {/if}
                                        <span class="max-w-[80%]">{lecturer.name}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        {#if item.room}
                            <span class="flex items-center gap-1.5">
                                {#if item.room.url}
                                    <a
                                        href={item.room.url}
                                        target="_blank"
                                        rel="noopener"
                                        title={item.room.name}
                                        class="mt-2 rounded-lg border border-primary px-4 py-2 text-sm transition-colors first-letter:capitalize hover:underline"
                                        data-no-translate
                                    >
                                        {item.room.name}
                                    </a>
                                {:else}
                                    <Icon
                                        class="h-3 w-3 sm:h-2 sm:w-2 lg:h-3 lg:w-3"
                                        iconName="pin"
                                        ariaHidden
                                    />
                                    <span class="max-w-[80%]">{item.room.name}</span>
                                {/if}
                            </span>
                        {/if}
                        {#if extendedAggregateSchedule.headers.length > 1 || extendedAggregateSchedule.type !== 'group'}
                            {#each item.groups as itemGroup}
                                <span class="text-right">
                                    {itemGroup}
                                </span>
                            {/each}
                        {/if}
                        {#if item.extra}
                            <span
                                class="mt-1 border-t-2 border-t-secondary pt-1 text-sm text-error"
                            >
                                {item.extra}
                            </span>
                        {/if}
                    </li>
                {/each}
            </ul>
        </li>
    {/each}
</ul>
