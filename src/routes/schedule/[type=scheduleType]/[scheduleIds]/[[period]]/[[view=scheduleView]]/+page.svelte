<script lang="ts">
    import { onMount } from 'svelte';
    import { navigating, page } from '$app/stores';
    import { goto, invalidateAll, replaceState } from '$app/navigation';
    import { languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import { i18n } from '$lib/i18n';
    import type { Schedule, ScheduleView } from '$lib/types';
    import {
        CACHE_MAX_AGE_SECONDS,
        MAX_SELECTABLE_SCHEDULES,
        SCHEDULE_TYPE_TO_LABELS,
        SCHEDULE_VIEWS,
        SCHEDULE_VIEW_TO_LABEL,
        SEARCH_PARAM,
        UEK_TIME_ZONE
    } from '$lib/consts';
    import {
        createMoodleURL,
        createOriginalURL,
        createSchedulePickerURL,
        createScheduleURL
    } from '$lib/utils';
    import { createScheduleViewStore, getFavoriteSchedulesStore } from '$lib/stores';
    import ScheduleViewAgenda from '$lib/components/scheduleView/ScheduleViewAgenda.svelte';
    import ScheduleViewWeek from '$lib/components/scheduleView/ScheduleViewWeek.svelte';
    import ScheduleViewTable from '$lib/components/scheduleView/ScheduleViewTable.svelte';
    import SvgIcon from '$lib/components/SvgIcon.svelte';
    import PageMetadata from '$lib/components/PageMetadata.svelte';
    import moodleLecturerLinkIcon from '$lib/assets/moodleLecturerLinkIcon.jpg';

    const favoriteSchedulesStore = getFavoriteSchedulesStore();

    const periodOptionsDateFormatter = new Intl.DateTimeFormat(languageTag(), {
        timeZone: UEK_TIME_ZONE,
        dateStyle: 'medium'
    });

    const { data } = $props();

    const scheduleViewStore = createScheduleViewStore(data.initialScheduleView);

    const currentScheduleTypeLabels = $derived(SCHEDULE_TYPE_TO_LABELS[data.type]);

    const periodOptions = $derived(
        data.periods.map((period, i) => ({
            value: i,
            label: periodOptionsDateFormatter.formatRange(
                new Date(period.from),
                new Date(period.to)
            ),
            selected: data.currentPeriodIndex === i
        }))
    );

    const viewsOptions = $derived(
        SCHEDULE_VIEWS.map((view) => ({
            value: view,
            label: SCHEDULE_VIEW_TO_LABEL[view](),
            selected: view === $scheduleViewStore
        }))
    );

    const CurrentScheduleViewComponent = $derived(
        {
            agenda: ScheduleViewAgenda,
            week: ScheduleViewWeek,
            table: ScheduleViewTable
        }[$scheduleViewStore]
    );

    onMount(() => {
        let lastDataUpdate = Date.now();
        let dataUpdateTimeout: ReturnType<typeof setTimeout> | undefined;

        const startDataUpdateTimeout = () => {
            if (!dataUpdateTimeout) {
                dataUpdateTimeout = setTimeout(
                    () => {
                        invalidateAll();
                        lastDataUpdate = Date.now();
                    },
                    Math.max(lastDataUpdate + CACHE_MAX_AGE_SECONDS.SCHEDULE * 1000 - Date.now(), 0)
                );
            }
        };
        const stopDataUpdateTimeout = () => {
            if (dataUpdateTimeout) {
                clearTimeout(dataUpdateTimeout);
                dataUpdateTimeout = undefined;
            }
        };
        startDataUpdateTimeout();

        const visibilityChangeEventHandler = () => {
            if (document.visibilityState === 'visible') {
                startDataUpdateTimeout();
            } else {
                stopDataUpdateTimeout();
            }
        };
        document.addEventListener('visibilitychange', visibilityChangeEventHandler);
        return () => {
            document.removeEventListener('visibilitychange', visibilityChangeEventHandler);
            stopDataUpdateTimeout();
        };
    });
</script>

<PageMetadata
    titleSegments={[data.headers.map((schedule) => schedule.name).join(', ')]}
    description={m.metaPageDescriptionSchedule({
        schedules: data.headers.map((schedule) => schedule.name).join(', ')
    })}
    noIndexNoFollow={data.headers.length > 1 || !!$page.params.scheduleView}
/>
{#snippet favoriteButton(header: (typeof data.headers)[number], buttonClassName: string)}
    <form
        method="POST"
        class="flex rounded-full bg-transparent p-0.5 transition-colors hover:bg-secondary"
    >
        <input
            type="hidden"
            name="fav"
            value={JSON.stringify({
                id: header.id,
                name: header.name,
                type: data.type
            })}
        />
        {#if $favoriteSchedulesStore.isFavorite(header.id)}
            <button
                class={buttonClassName}
                type="submit"
                formaction="?/favoriteRemove"
                title={m.removeScheduleFromFavorites({
                    schedule: header.name
                })}
                onclick={(e) => {
                    e.preventDefault();
                    favoriteSchedulesStore.remove(header.id);
                }}
            >
                <SvgIcon
                    class="h-full w-full text-favorite-default hover:text-favorite-hover"
                    iconName="star"
                />
            </button>
        {:else}
            <button
                class={buttonClassName}
                type="submit"
                formaction="?/favoriteAdd"
                title={m.addScheduleToFavorites({
                    schedule: header.name
                })}
                onclick={(e) => {
                    e.preventDefault();
                    favoriteSchedulesStore.add({
                        id: header.id,
                        name: header.name,
                        type: data.type
                    });
                }}
            >
                <SvgIcon class="h-full w-full hover:text-favorite-default" iconName="starOutline" />
            </button>
        {/if}
    </form>
{/snippet}

{#snippet moodleButton(lecturerName: string, moodleId: string)}
    <a
        class="my-auto h-3 w-4 text-accent hover:underline"
        href={createMoodleURL(moodleId)}
        title={m.moodleLinkTitle({
            lecturerName
        })}
        target="_blank"
        rel="noopener"
    >
        <img
            src={moodleLecturerLinkIcon}
            alt={m.moodleLinkTitle({
                lecturerName
            })}
        />
    </a>
{/snippet}

<div>
    <div class="mb-4 flex flex-col justify-between gap-2 sm:gap-4 xl:flex-row">
        <div class="flex flex-wrap gap-4 sm:justify-between xl:justify-start">
            {#if data.headers.length === 1}
                <div class="flex flex-wrap gap-2">
                    <a
                        class="flex items-center gap-3 text-2xl font-bold transition-all hover:text-secondary md:text-3xl"
                        href={createSchedulePickerURL({
                            scheduleType: data.type
                        })}
                        title={currentScheduleTypeLabels.documentTitle()}
                    >
                        <span>{data.headers[0]!.name}</span>
                        <SvgIcon class="h-5 w-5" iconName="chevronDown" ariaHidden />
                    </a>
                    {#if data.type === 'lecturer' && data.headers[0]!.moodleId}
                        {@render moodleButton(data.headers[0]!.name, data.headers[0]!.moodleId)}
                    {/if}
                    {@render favoriteButton(data.headers[0]!, 'my-auto h-6 w-6 md:h-7 md:w-7')}
                </div>
            {:else}
                <div class="flex flex-wrap gap-4 lg:flex-nowrap">
                    {#each data.headers as header}
                        <span
                            class="flex items-center gap-2 rounded border p-2 text-sm font-medium sm:px-4 xl:text-base"
                        >
                            <span>{header.name}</span>
                            {#if data.type === 'lecturer' && header.moodleId}
                                {@render moodleButton(header.name, header.moodleId)}
                            {/if}
                            {@render favoriteButton(header, 'h-5 w-5')}
                            <a
                                class="items-center rounded-sm p-1 text-sm hover:bg-secondary hover:underline"
                                href={createScheduleURL({
                                    scheduleType: data.type,
                                    ids: data.headers.filter((h) => h !== header).map((h) => h.id),
                                    period: data.currentPeriodIndex,
                                    scheduleView: $page.params.scheduleView as
                                        | ScheduleView
                                        | undefined
                                })}
                                title={m.removeSchedule({
                                    schedule: header.name
                                })}
                            >
                                <SvgIcon class="h-3 w-3" iconName="cross" />
                                <span class="sr-only">
                                    {m.removeSchedule({
                                        schedule: header.name
                                    })}
                                </span>
                            </a>
                        </span>
                    {/each}
                </div>
            {/if}
            {#if data.headers.length < MAX_SELECTABLE_SCHEDULES}
                <a
                    title={currentScheduleTypeLabels.documentTitleMore()}
                    href={createSchedulePickerURL({
                        scheduleType: data.type,
                        pickerState: {
                            period: data.currentPeriodIndex,
                            ids: data.headers.map((header) => header.id)
                        }
                    })}
                    rel="nofollow"
                    class="flex items-center gap-2 rounded border px-4 py-2 transition-colors hover:bg-secondary sm:border-primary"
                >
                    <SvgIcon class="h-4 w-4" iconName="plus" />
                    <span class="hidden sm:block">
                        {currentScheduleTypeLabels.documentTitleMore()}
                    </span>
                </a>
            {/if}
        </div>

        <form
            action="?/periodAndView"
            method="POST"
            class="flex min-w-[40%] flex-wrap gap-2 sm:flex-nowrap sm:gap-4 2xl:min-w-[35%]"
        >
            <select
                title={m.scheduleViewPeriodPickerTitle()}
                name={SEARCH_PARAM.SCHEDULE.PERIOD}
                disabled={!!$navigating}
                class="w-full cursor-pointer border-b-2 border-b-secondary bg-transparent px-0 py-2 text-sm transition-colors hover:border-primary focus:border-primary focus:outline-none sm:py-2.5"
                onchange={(e) => {
                    e.preventDefault();

                    goto(
                        i18n.resolveRoute(
                            createScheduleURL({
                                scheduleType: data.type,
                                ids: data.headers.map((header) => header.id),
                                period: parseInt(e.currentTarget.value),
                                scheduleView: $page.params.scheduleView as ScheduleView | undefined
                            })
                        )
                    );
                }}
            >
                {#each periodOptions as option}
                    <option
                        class="bg-primary text-primary"
                        value={option.value}
                        label={option.label}
                        selected={option.selected}
                    ></option>
                {/each}
            </select>
            <select
                title={m.scheduleViewViewPickerTitle()}
                name={SEARCH_PARAM.SCHEDULE.VIEW}
                disabled={!!$navigating}
                class="w-full cursor-pointer border-b-2 border-b-secondary bg-transparent px-0 py-2 text-sm transition-colors hover:border-primary focus:border-primary focus:outline-none sm:py-2.5"
                onchange={(e) => {
                    e.preventDefault();

                    scheduleViewStore.set(e.currentTarget.value as ScheduleView);
                    replaceState(
                        i18n.resolveRoute(
                            createScheduleURL({
                                scheduleType: data.type,
                                ids: data.headers.map((header) => header.id),
                                period: data.currentPeriodIndex,
                                scheduleView: e.currentTarget.value as ScheduleView
                            })
                        ),
                        {}
                    );
                }}
            >
                {#each viewsOptions as option}
                    <option
                        class="bg-primary text-primary"
                        value={option.value}
                        label={option.label}
                        selected={option.selected}
                    ></option>
                {/each}
            </select>
            <noscript>
                <button
                    class="h-full w-full rounded border border-secondary px-4 py-2 text-sm transition-colors hover:border-primary hover:bg-secondary focus:border-primary focus:bg-secondary"
                    type="submit">{m.chooseGeneric()}</button
                >
            </noscript>
        </form>
    </div>

    {#if data.items.length > 0}
        <CurrentScheduleViewComponent
            scheduleItems={data.items}
            scheduleType={data.type}
            currentPeriod={data.periods[data.currentPeriodIndex] as Schedule['periods'][number]}
            isMultipleSchedules={data.headers.length > 1}
        />
    {:else}
        <div class="my-8 text-center text-lg font-semibold">{m.emptyScheduleMessage()}</div>
    {/if}

    <hr class="mt-4 border-secondary" />
    <div class="mt-4 flex flex-col gap-1">
        <span class="text-xl">
            {data.headers.length === 1 ? m.originalSchedule() : m.originalSchedules()}
        </span>
        {#each data.headers as header}
            <a
                class="max-w-min text-nowrap font-semibold text-accent hover:underline"
                href={createOriginalURL({
                    scheduleId: header.id,
                    scheduleType: data.type,
                    period: data.currentPeriodIndex
                }).toString()}
                title={header.name}
                target="_blank"
                rel="noopener"
            >
                {header.name}
            </a>
        {/each}
    </div>
</div>
