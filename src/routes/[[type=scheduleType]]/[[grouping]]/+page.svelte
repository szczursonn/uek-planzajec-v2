<script lang="ts" module>
    const getCurrentFiltersFromSearchParams = () => {
        const searchParams = browser
            ? new URLSearchParams(window.location.search)
            : getSyncStoreValue(page).url.searchParams;

        const filters = {} as Record<string, string>;

        for (const filterName of Object.values(SEARCH_PARAM.PICKER.FILTER)) {
            filters[filterName] = searchParams.get(filterName) ?? '';
        }

        return filters;
    };
</script>

<script lang="ts">
    import { onMount } from 'svelte';
    import { replaceState } from '$app/navigation';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';
    import * as m from '$lib/paraglide/messages';
    import { getGlobalContext } from '$lib/stores/globalContext';
    import { SCHEDULE_TYPE_TO_LABELS, SCHEDULE_TYPES, SEARCH_PARAM } from '$lib/consts';
    import { getPickerConfig } from '$lib/pickerConfig';
    import { encodePickerState } from '$lib/storeUtils';
    import { createSchedulePickerURL, createScheduleURL } from '$lib/linkUtils';
    import { getSyncStoreValue } from '$lib/utils';
    import NestableLinkList from '$lib/components/NestableLinkList.svelte';
    import Icon from '$lib/components/Icon.svelte';
    import PageMetadata from '$lib/components/PageMetadata.svelte';
    import Select from '$lib/components/form/Select.svelte';
    import TextInput from '$lib/components/form/TextInput.svelte';
    import Button from '$lib/components/form/Button.svelte';

    const { data } = $props();
    const { savedScheduleSetsStore } = getGlobalContext();

    const savedScheduleSetsOptions = $derived(
        data.pickerState || $page.params.grouping
            ? []
            : $savedScheduleSetsStore.ofType(data.scheduleType).map((savedScheduleSet) => ({
                  label: savedScheduleSet.map((scheduleHeader) => scheduleHeader.name).join(', '),
                  href: createScheduleURL({
                      scheduleType: data.scheduleType,
                      scheduleIds: savedScheduleSet.map((scheduleHeader) => scheduleHeader.id)
                  })
              }))
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
                    scheduleIds: data.pickerState
                        ? [...data.pickerState.scheduleIds, header.id]
                        : [header.id],
                    schedulePeriod: data.pickerState?.schedulePeriod
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

    const filters = $state(getCurrentFiltersFromSearchParams());
    const filteredOptionsGroups = $derived(getFilteredOptionGroups(filters));

    const updateURLOnChange = $derived(
        (
            event: Event & { currentTarget: EventTarget & (HTMLInputElement | HTMLSelectElement) }
        ) => {
            const newURL = new URL(window.location.href);
            if (event.currentTarget.value) {
                newURL.searchParams.set(event.currentTarget.name, event.currentTarget.value);
            } else {
                newURL.searchParams.delete(event.currentTarget.name);
            }
            replaceState(newURL, {});
        }
    );

    // clear filters on navigation
    onMount(() => {
        return page.subscribe(() => {
            for (const [filterName, value] of Object.entries(getCurrentFiltersFromSearchParams())) {
                filters[filterName] = value;
            }
        });
    });
</script>

<PageMetadata
    titleParts={[
        $page.params.grouping,
        data.pickerState
            ? SCHEDULE_TYPE_TO_LABELS[data.scheduleType].documentTitleMore()
            : SCHEDULE_TYPE_TO_LABELS[data.scheduleType].documentTitle()
    ]}
    description={m.metaPageDescriptionPicker()}
    disallowRobots={!!data.pickerState}
/>
<div class="flex flex-col gap-4">
    {#if data.pickerState}
        <a
            class="mr-auto flex items-center gap-3 transition-colors hover:text-secondary hover:underline"
            href={createScheduleURL({
                scheduleType: data.scheduleType,
                scheduleIds: data.pickerState.scheduleIds,
                schedulePeriod: data.pickerState.schedulePeriod
            })}
            title={m.backToSchedule()}
        >
            <Icon class="h-5 w-5" iconName="arrowLeft" />
            <span>{m.backToSchedule()}</span>
        </a>

        <hr class="border-secondary" />
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
                <Icon class="h-5 w-5 transition-colors" iconName="arrowLeft" ariaHidden />
                <span class="sr-only text-accent">{m.navigateBackCTA()}</span>
            </a>
            <span>{$page.params.grouping}</span>
        </div>
    {:else}
        <ul class="flex">
            {#each tabs as tab}
                <li class="flex">
                    {#if tab.active}
                        <span
                            class="border-b-2 border-b-accent-default p-4 font-semibold text-accent"
                        >
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

    {#if savedScheduleSetsOptions.length > 0}
        <div class="rounded-lg border border-secondary p-2">
            <span class="flex items-center gap-2">
                <span class="text-xl font-bold">{m.savedScheduleSetsSection()}</span>
                <Icon class="h-5 w-5" iconName="bookmark" ariaHidden />
            </span>
            <ul class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {#each savedScheduleSetsOptions as savedScheduleSetOption}
                    <li
                        class="border-b-2 border-b-secondary transition-colors hover:border-b-accent-default hover:bg-secondary"
                    >
                        <a
                            class="flex h-full items-center px-2 py-4 text-sm font-semibold"
                            href={savedScheduleSetOption.href}
                            title={savedScheduleSetOption.label}
                        >
                            {savedScheduleSetOption.label}
                        </a>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}

    <form action="" method="GET" class="flex flex-wrap gap-2 rounded-xl">
        {#each filtersConfig as config}
            {#if config.type === 'search'}
                <TextInput
                    name={config.name}
                    type="search"
                    placeholder={config.placeholder}
                    bind:value={filters[config.name]}
                    onchange={updateURLOnChange}
                />
            {:else}
                <Select
                    name={config.name}
                    title={config.placeholder}
                    placeholder={config.placeholder}
                    options={config.options}
                    bind:value={filters[config.name]}
                    class="grow basis-[51%] md:basis-[34%] xl:basis-[21%]"
                    onchange={updateURLOnChange}
                />
            {/if}
        {/each}
        {#if data.pickerState}
            <input
                type="hidden"
                name={SEARCH_PARAM.PICKER.STATE}
                value={encodePickerState(data.pickerState)}
            />
        {/if}
        <noscript class="basis-full">
            <Button label={m.searchButton()} variant="outline" class="max-w-full border-tertiary" />
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
                        replaceState(e.currentTarget.href, {});
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
