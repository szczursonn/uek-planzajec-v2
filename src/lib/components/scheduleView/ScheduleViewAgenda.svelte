<script lang="ts">
    import { languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import type { ScheduleItem, ScheduleViewComponentProps } from '$lib/types';
    import { UEK_TIME_ZONE } from '$lib/consts';
    import {
        createHourRangeLabelProvider,
        createMoodleURL,
        createScheduleItemTypeClassProvider,
        isScheduleItemCancelled
    } from '$lib/utils';
    import { getLocalDateParts } from '$lib/dateUtils';
    import { now } from '$lib/stores';
    import SvgIcon from '$lib/components/SvgIcon.svelte';
    import moodleLecturerLinkIcon from '$lib/assets/moodleLecturerLinkIcon.jpg';

    const { scheduleType, scheduleItems, isMultipleSchedules }: ScheduleViewComponentProps =
        $props();
    const getScheduleItemTypeClass = createScheduleItemTypeClassProvider(
        {
            lecture: 'bg-sky-600',
            exercise: 'bg-amber-600',
            language: 'bg-green-600',
            seminar: 'bg-indigo-700',
            exam: 'bg-red-500'
        },
        'border-2 border-zinc-300 bg-black'
    );

    const sortedItemGroups = $derived.by(() => {
        const createHourRangeLabel = createHourRangeLabelProvider();

        if (scheduleItems.length === 0) {
            return [];
        }

        const hasMultipleYears =
            getLocalDateParts(new Date(scheduleItems[0]!.start)).year !==
            getLocalDateParts(new Date(scheduleItems.at(-1)!.start)).year;

        const monthHeaderFormatter = new Intl.DateTimeFormat(languageTag(), {
            timeZone: UEK_TIME_ZONE,
            month: 'long',
            year: hasMultipleYears ? 'numeric' : undefined
        });

        const dayOfWeekFormatter = new Intl.DateTimeFormat(languageTag(), {
            timeZone: UEK_TIME_ZONE,
            weekday: 'short'
        });

        const currentDateParts = getLocalDateParts($now);

        const monthGroups = [] as {
            monthHeader: string;
            dayGroups: {
                dayOfMonth: number;
                dayOfWeek: string;
                isCurrent: boolean;
                items: (ScheduleItem & {
                    hourRangeLabel: string;
                    isCancelled: boolean;
                })[];
            }[];
        }[];

        let previousItemStartDateParts: ReturnType<typeof getLocalDateParts> | undefined;
        for (const item of scheduleItems) {
            const itemStartDate = new Date(item.start);
            const itemStartDateParts = getLocalDateParts(itemStartDate);

            if (
                itemStartDateParts.day !== previousItemStartDateParts?.day ||
                itemStartDateParts.month !== previousItemStartDateParts.month ||
                itemStartDateParts.year !== previousItemStartDateParts.year
            ) {
                if (
                    itemStartDateParts.month !== previousItemStartDateParts?.month ||
                    itemStartDateParts.year !== previousItemStartDateParts.year
                ) {
                    monthGroups.push({
                        monthHeader: monthHeaderFormatter.format(itemStartDate),
                        dayGroups: []
                    });
                }

                monthGroups.at(-1)!.dayGroups.push({
                    dayOfMonth: itemStartDateParts.day,
                    dayOfWeek: dayOfWeekFormatter.format(itemStartDate),
                    isCurrent:
                        itemStartDateParts.day === currentDateParts.day &&
                        itemStartDateParts.month === currentDateParts.month &&
                        itemStartDateParts.year === currentDateParts.year,
                    items: []
                });
                previousItemStartDateParts = itemStartDateParts;
            }

            monthGroups
                .at(-1)!
                .dayGroups.at(-1)!
                .items.push({
                    ...item,
                    hourRangeLabel: createHourRangeLabel(itemStartDate, new Date(item.end)),
                    isCancelled: isScheduleItemCancelled(item)
                });
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
            <ul class="divide-y-2 divide-accent">
                {#each monthGroup.dayGroups as dayGroup}
                    <li class="grid grid-cols-12">
                        <div
                            class="col-span-3 m-4 flex flex-col items-center md:col-span-2 lg:col-span-1"
                        >
                            <span
                                class={`text-2xl font-bold sm:text-3xl ${dayGroup.isCurrent ? 'rounded-full bg-gradient-to-t from-blue-500 to-violet-500 p-2.5' : ''}`}
                            >
                                {dayGroup.dayOfMonth}
                            </span>
                            <span class="text-sm sm:text-base">{dayGroup.dayOfWeek}</span>
                        </div>
                        <ul class="col-span-9 md:col-span-10 lg:col-span-11">
                            {#each dayGroup.items as item}
                                <li
                                    class={`my-4 grid grid-cols-12 items-center sm:items-start ${item.isCancelled ? 'text-secondary' : ''}`}
                                >
                                    <span
                                        class="col-span-full flex flex-row items-center gap-2 text-sm lg:col-span-2"
                                    >
                                        <div
                                            class={`${getScheduleItemTypeClass(
                                                item.type
                                            )} h-4 w-4 rounded-full sm:h-5 sm:w-5`}
                                            aria-hidden="true"
                                        ></div>
                                        <span class={item.isCancelled ? 'line-through' : ''}>
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
                                            {#if isMultipleSchedules || scheduleType !== 'group'}
                                                <span
                                                    class="whitespace-nowrap text-xs text-secondary"
                                                >
                                                    {item.groups.join(', ')}
                                                </span>
                                            {/if}
                                        </div>
                                        {#if item.lecturers.length > 0}
                                            <div class="text-xs">
                                                {#each item.lecturers as lecturer}
                                                    <div class="flex items-center gap-1">
                                                        <span>{lecturer.name}</span>
                                                        {#if lecturer.moodleId}
                                                            <a
                                                                class="h-3 w-4 text-accent hover:underline"
                                                                href={createMoodleURL(
                                                                    lecturer.moodleId
                                                                )}
                                                                title={m.moodleLinkTitle({
                                                                    lecturerName:
                                                                        lecturer.name ?? ''
                                                                })}
                                                                target="_blank"
                                                                rel="noopener"
                                                            >
                                                                <img
                                                                    src={moodleLecturerLinkIcon}
                                                                    alt={m.moodleLinkTitle({
                                                                        lecturerName:
                                                                            lecturer.name ?? ''
                                                                    })}
                                                                />
                                                            </a>
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                        {#if item.room}
                                            <span class="flex items-center gap-1 text-xs">
                                                {#if item.roomUrl}
                                                    <SvgIcon
                                                        class="mb-0.5 h-3 w-3"
                                                        iconName="internet"
                                                    />
                                                    <a
                                                        class="hover:underline"
                                                        href={item.roomUrl}
                                                        title={item.room}
                                                        target="_blank"
                                                        rel="noopener"
                                                    >
                                                        {item.room}
                                                    </a>
                                                {:else}
                                                    <SvgIcon
                                                        class="mb-0.5 h-3 w-3"
                                                        iconName="pin"
                                                    />
                                                    <span>{item.room}</span>
                                                {/if}
                                            </span>
                                        {/if}
                                        {#if item.extra}
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
