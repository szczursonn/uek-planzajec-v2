<script lang="ts">
    import { onMount } from 'svelte';
    import { replaceState } from '$app/navigation';
    import { page } from '$app/stores';
    import * as m from '$lib/paraglide/messages';
    import { SCHEDULE_TYPE_TO_LABELS, SCHEDULE_TYPES } from '$lib/consts';
    import { createSchedulePickerURL, createScheduleURL } from '$lib/utils';
    import { getPickerConfig } from '$lib/pickerConfig';
    import { getFavoriteSchedulesStore } from '$lib/stores';
    import NestableLinkList from '$lib/components/NestableLinkList.svelte';
    import SvgIcon from '$lib/components/SvgIcon.svelte';
    import PageMetadata from '$lib/components/PageMetadata.svelte';
    const { data } = $props();

    const favoriteSchedulesStore = getFavoriteSchedulesStore();
    const selectableFavoriteSchedules = $derived(
        $favoriteSchedulesStore
            .ofType(data.scheduleType)
            .filter(
                (favoriteSchedule) =>
                    !data.pickerState || !data.pickerState.ids.includes(favoriteSchedule.id)
            )
    );

    const tabs = $derived(
        SCHEDULE_TYPES.map((scheduleType) => ({
            label: SCHEDULE_TYPE_TO_LABELS[scheduleType].tabName(),
            href: createSchedulePickerURL({ scheduleType }),
            active: scheduleType === data.scheduleType
        }))
    );
    const options = $derived.by(() => {
        if (data.isHeader) {
            return data.headers.map((header) => ({
                label: header.name,
                href: createScheduleURL({
                    scheduleType: data.scheduleType,
                    ids: data.pickerState ? [...data.pickerState.ids, header.id] : [header.id],
                    period: data.pickerState?.period
                })
            }));
        }

        return data.groupings.map((grouping) => ({
            label: grouping,
            href: createSchedulePickerURL({
                scheduleType: data.scheduleType,
                grouping,
                pickerState: data.pickerState
            })
        }));
    });

    // enterprise shit
    const { filtersConfig, getFilteredOptionGroups } = $derived(
        getPickerConfig({
            options,
            scheduleType: data.scheduleType,
            isHeader: data.isHeader,
            grouping: $page.params.grouping
        })
    );

    const filters = $state(
        Object.fromEntries($page.url.searchParams.entries()) as Record<string, string>
    );

    const filteredOptionsGroups = $derived(getFilteredOptionGroups(filters));

    const handleChangeEvent = $derived(
        (e: { currentTarget: HTMLInputElement | HTMLSelectElement }) => {
            const newURL = new URL($page.url);
            if (e.currentTarget.value) {
                newURL.searchParams.set(e.currentTarget.name, e.currentTarget.value);
            } else {
                newURL.searchParams.delete(e.currentTarget.name);
            }
            replaceState(newURL, {});
        }
    );

    // clear filters on navigation
    onMount(() => {
        let lastPathname: string | undefined;
        const unsubscribePageStore = page.subscribe(() => {
            if (lastPathname !== undefined && window.location.pathname !== lastPathname) {
                Object.keys(filters).forEach((key) => (filters[key] = ''));
                new URLSearchParams(window.location.search)
                    .entries()
                    .forEach(([key, value]) => (filters[key] = value));
            }

            lastPathname = window.location.pathname;
        });

        return unsubscribePageStore;
    });
</script>

<PageMetadata
    titleSegments={[
        $page.params.grouping,
        data.pickerState
            ? SCHEDULE_TYPE_TO_LABELS[data.scheduleType].documentTitleMore()
            : SCHEDULE_TYPE_TO_LABELS[data.scheduleType].documentTitle()
    ]}
    description={m.metaPageDescriptionPicker()}
    noIndexNoFollow={!!data.pickerState}
/>
<div class="flex flex-col gap-4">
    {#if data.pickerState}
        <a
            class="mr-auto flex items-center gap-3 transition-colors hover:text-secondary hover:underline"
            href={createScheduleURL({
                scheduleType: data.scheduleType,
                ids: data.pickerState.ids,
                period: data.pickerState.period
            })}
            title={m.backToSchedule()}
        >
            <SvgIcon class="h-5 w-5" iconName="arrowLeft" />
            <span>{m.backToSchedule()}</span>
        </a>

        <hr class="border-secondary" />
    {:else if !$page.params.grouping}
        <ul class="flex">
            {#each tabs as tab}
                <li class="flex">
                    {#if tab.active}
                        <span class="border-b-2 border-b-accent p-4 font-semibold text-accent">
                            {tab.label}
                        </span>
                    {:else}
                        <a
                            href={tab.href}
                            class="border-b-2 border-b-secondary p-4 text-secondary transition-colors hover:border-b-primary hover:text-primary"
                        >
                            {tab.label}
                        </a>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}

    {#if $page.params.grouping}
        <div class="flex items-center gap-3">
            <a
                class="hover:text-secondary hover:underline"
                href={createSchedulePickerURL({
                    scheduleType: data.scheduleType,
                    pickerState: data.pickerState
                })}
                title={m.navigateBackCTA()}
            >
                <SvgIcon class="h-5 w-5 transition-colors" iconName="arrowLeft" ariaHidden />
                <span class="sr-only text-accent">{m.navigateBackCTA()}</span>
            </a>
            <span>{$page.params.grouping}</span>
        </div>
    {:else if selectableFavoriteSchedules.length > 0}
        <div class="rounded-lg border border-secondary p-2">
            <span class="text-xl font-bold">{m.favoritesSectionHeader()}</span>
            <ul class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {#each selectableFavoriteSchedules as favoriteSchedule}
                    <li class="relative">
                        <a
                            class="block h-full border-b-2 border-b-secondary px-2 py-4 text-sm font-semibold transition-colors hover:border-b-accent hover:bg-secondary"
                            href={createScheduleURL({
                                scheduleType: favoriteSchedule.type,
                                ids: data.pickerState
                                    ? [...data.pickerState.ids, favoriteSchedule.id]
                                    : [favoriteSchedule.id],
                                period: data.pickerState?.period
                            })}
                            title={favoriteSchedule.name}
                        >
                            {favoriteSchedule.name}
                        </a>

                        <form
                            class="absolute right-4 top-3.5 rounded-full bg-transparent p-0.5 text-favorite-default transition-colors hover:bg-secondary hover:text-favorite-hover"
                            method="POST"
                            onsubmit={(e) => {
                                e.preventDefault();
                                favoriteSchedulesStore.remove(favoriteSchedule.id);
                            }}
                        >
                            <input type="hidden" name="fav" value={favoriteSchedule.id} />
                            <button
                                type="submit"
                                title={m.removeScheduleFromFavorites({
                                    schedule: favoriteSchedule.name
                                })}
                            >
                                <SvgIcon class="h-5 w-5" iconName="star" />
                            </button>
                        </form>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}

    <form action="" method="GET" class="flex flex-wrap gap-2 rounded-xl">
        {#each filtersConfig as config}
            {#if config.type === 'search'}
                <div class="relative basis-full">
                    <div
                        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
                    >
                        <SvgIcon class="h-4 w-4 text-secondary" iconName="search" />
                    </div>
                    <input
                        name={config.name}
                        type="search"
                        placeholder={config.placeholder}
                        autocomplete="off"
                        bind:value={filters[config.name]}
                        onchange={handleChangeEvent}
                        class="block w-full rounded-lg border border-tiertiary bg-primary p-2 pl-10 text-sm text-primary transition-colors placeholder:text-secondary focus:border-accent focus-visible:outline-none"
                    />
                </div>
            {:else}
                <select
                    name={config.name}
                    bind:value={filters[config.name]}
                    onchange={handleChangeEvent}
                    title={config.placeholder}
                    class={`w-full grow basis-[51%] cursor-pointer rounded-lg border border-tiertiary bg-primary p-2 text-secondary transition-colors focus:border-accent focus-visible:outline-none has-[option:checked:not([value=""])]:text-primary md:basis-[34%] xl:basis-[21%]`}
                >
                    {#if config.placeholder}
                        <option class="text-secondary" value="" label={config.placeholder}></option>
                    {/if}
                    {#each config.options as option}
                        <option
                            class="text-primary"
                            value={option.value}
                            label={option.label ?? option.value}
                            selected={filters[config.name] === option.value}
                        ></option>
                    {/each}
                </select>
            {/if}
        {/each}
        <noscript class="basis-full">
            <button
                type="submit"
                class="text-secondary-text-light w-full rounded-lg border border-tiertiary px-4 py-2 text-sm transition-colors hover:border-accent focus:border-accent"
            >
                {m.searchButton()}
            </button>
        </noscript>
        {#if filtersConfig.length > 1 && Object.keys(filters).some((key) => filters[key])}
            <div class="mb-2 basis-full">
                <a
                    class="text-accent hover:underline"
                    href={createSchedulePickerURL({
                        scheduleType: data.scheduleType,
                        grouping: $page.params.grouping,
                        pickerState: data.pickerState
                    })}
                    title={m.clearFilters()}
                    onclick={(e) => {
                        e.preventDefault();

                        const newURL = new URL($page.url);
                        Object.keys(filters).forEach((key) => {
                            filters[key] = '';
                            newURL.searchParams.delete(key);
                        });

                        replaceState(newURL, {});
                    }}
                >
                    {m.clearFilters()}
                </a>
            </div>
        {/if}
    </form>

    {#if filteredOptionsGroups.length > 0}
        <NestableLinkList optionGroups={filteredOptionsGroups} />
    {:else}
        <div class="text-center">{m.pickerNoResultsMessage()}</div>
    {/if}
</div>
