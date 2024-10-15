<script lang="ts">
    import { languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import type { ScheduleViewComponentProps } from '$lib/types';
    import { UEK_TIME_ZONE } from '$lib/consts';
    import { now } from '$lib/stores';
    import {
        createHourRangeLabelProvider,
        createMoodleURL,
        createScheduleItemTypeClassProvider,
        isScheduleItemCancelled
    } from '$lib/utils';
    import {
        eachLocalDayBetween,
        getNextSunday,
        getPreviousMonday,
        getLocalDateParts
    } from '$lib/dateUtils';
    import SvgIcon from '$lib/components/SvgIcon.svelte';
    import moodleLecturerLinkIcon from '$lib/assets/moodleLecturerLinkIcon.jpg';

    const {
        scheduleType,
        scheduleItems,
        currentPeriod,
        isMultipleSchedules
    }: ScheduleViewComponentProps = $props();

    const dayGroups = $derived.by(() => {
        const createHourRangeLabel = createHourRangeLabelProvider();
        const getScheduleItemTypeClass = createScheduleItemTypeClassProvider(
            {
                lecture: 'bg-sky-800 border-sky-900',
                exercise: 'bg-amber-800 border-amber-900',
                language: 'bg-green-700 border-green-900',
                seminar: 'bg-indigo-700 border-indigo-900',
                exam: 'bg-red-700 border-red-900',
                cancelled: 'bg-secondary border-gray-900 border-2 text-secondary'
            },
            'bg-secondary border-gray-900 border-2'
        );

        const extendedItems = scheduleItems.map((item) => {
            const startDate = new Date(item.start);
            const endDate = new Date(item.end);

            return {
                ...item,
                startDate,
                endDate,
                isCancelled: isScheduleItemCancelled(item),
                hourRangeLabel: createHourRangeLabel(startDate, endDate),
                className: getScheduleItemTypeClass(item.type)
            };
        });

        const groupLabelFormatter = new Intl.DateTimeFormat(languageTag(), {
            timeZone: UEK_TIME_ZONE,
            day: 'numeric',
            month: 'short',
            weekday: 'short'
        });

        const periodStartDate = new Date(currentPeriod.from);
        const periodEndDate = new Date(currentPeriod.to);

        const groups: {
            label: string;
            items: typeof extendedItems;
            isOutsideOfSelectedPeriod: boolean;
            isCurrent: boolean;
        }[] = [];

        const currentDateParts = getLocalDateParts($now);

        let i = 0;
        let previousDateParts: ReturnType<typeof getLocalDateParts> | undefined;
        for (const date of eachLocalDayBetween(
            getPreviousMonday(
                new Date(Math.min(periodStartDate.getTime(), extendedItems[0]!.startDate.getTime()))
            ),
            getNextSunday(
                new Date(Math.max(periodEndDate.getTime(), extendedItems.at(-1)!.endDate.getTime()))
            )
        )) {
            const dateParts = getLocalDateParts(date);

            if (
                !previousDateParts ||
                dateParts.day !== previousDateParts.day ||
                dateParts.month !== previousDateParts.month ||
                dateParts.year !== previousDateParts.year
            ) {
                groups.push({
                    label: groupLabelFormatter.format(date),
                    isOutsideOfSelectedPeriod:
                        date.getTime() < periodStartDate.getTime() ||
                        date.getTime() > periodEndDate.getTime(),
                    isCurrent:
                        currentDateParts.day === dateParts.day &&
                        currentDateParts.month === dateParts.month &&
                        currentDateParts.year === dateParts.year,
                    items: []
                });
                previousDateParts = dateParts;
            }

            while (i < extendedItems.length) {
                const itemStartDateParts = getLocalDateParts(extendedItems[i]!.startDate);

                if (
                    itemStartDateParts.day !== dateParts.day ||
                    itemStartDateParts.month !== dateParts.month ||
                    itemStartDateParts.year !== dateParts.year
                ) {
                    break;
                }

                groups.at(-1)!.items.push(extendedItems[i++]!);
            }
        }

        return groups;
    });
</script>

<div
    class="my-8 flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg bg-warn p-4 text-center text-warn sm:hidden"
    aria-hidden="true"
>
    <SvgIcon class="h-8 w-8" iconName="alert" />
    <span class="font-medium">{m.scheduleViewWeekScreenTooSmallMessage()}</span>
</div>
<ul class="grid grid-cols-1 gap-x-1 gap-y-4 sm:grid-cols-7 sm:gap-y-10 md:gap-x-2">
    {#each dayGroups as group}
        <li class={`flex-col gap-2 ${group.items.length === 0 ? 'hidden sm:flex' : 'flex'}`}>
            <span
                class={`sticky top-0 z-10 flex flex-col items-center truncate border-y-2 text-base sm:text-xs md:text-sm lg:text-base ${group.isCurrent ? 'border-accent bg-accent font-bold' : group.isOutsideOfSelectedPeriod ? 'border-secondary bg-primary italic text-secondary' : 'bg-primary'}`}
            >
                {group.label}
            </span>
            <ul class="flex flex-col gap-2">
                {#each group.items as item}
                    <li
                        class={`${item.className} relative flex flex-col gap-y-[1px] rounded-lg border-2 p-3 text-xs sm:p-1.5 sm:text-xxs lg:p-3 lg:text-xs`}
                    >
                        <span class="text-sm font-bold sm:break-all sm:text-xs lg:break-normal">
                            {[item.subject, item.type].filter(Boolean).join(' - ')}
                        </span>
                        <div class="flex items-center gap-1.5">
                            <SvgIcon
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
                                            >
                                                <img
                                                    src={moodleLecturerLinkIcon}
                                                    alt={m.moodleLinkTitle({
                                                        lecturerName: lecturer.name ?? ''
                                                    })}
                                                />
                                            </a>
                                        {:else}
                                            <SvgIcon
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
                                    >
                                        {item.room.name}
                                    </a>
                                {:else}
                                    <SvgIcon
                                        class="h-3 w-3 sm:h-2 sm:w-2 lg:h-3 lg:w-3"
                                        iconName="pin"
                                        ariaHidden
                                    />
                                    <span class="max-w-[80%]">{item.room.name}</span>
                                {/if}
                            </span>
                        {/if}
                        {#if isMultipleSchedules || scheduleType !== 'group'}
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
