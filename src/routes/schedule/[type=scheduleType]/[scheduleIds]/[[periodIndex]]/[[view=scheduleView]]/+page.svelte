<script lang="ts">
    import { navigating, page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { languageTag } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
    import { i18n } from '$lib/i18n';
    import type { Schedule, ScheduleView } from '$lib/types';
    import {
        MAX_SELECTABLE_SCHEDULES,
        SCHEDULE_TYPE_TO_LABELS,
        SCHEDULE_VIEWS,
        SCHEDULE_VIEW_TO_LABEL,
        SEARCH_PARAM,
        UEK_TIME_ZONE
    } from '$lib/consts';
    import { getSavedScheduleSetKey } from '$lib/storeUtils';
    import {
        createMoodleURL,
        createOriginalURL,
        createSchedulePickerURL,
        createScheduleURL
    } from '$lib/linkUtils';
    import { getGlobalContext } from '$lib/stores/globalContext';
    import ScheduleViewAgenda from '$lib/components/schedule/ScheduleViewAgenda.svelte';
    import ScheduleViewWeek from '$lib/components/schedule/ScheduleViewWeek.svelte';
    import ScheduleViewTable from '$lib/components/schedule/ScheduleViewTable.svelte';
    import ScheduleViewICal from '$lib/components/schedule/ScheduleViewICal.svelte';
    import Icon from '$lib/components/Icon.svelte';
    import PageMetadata from '$lib/components/PageMetadata.svelte';
    import Button from '$lib/components/form/Button.svelte';
    import Select from '$lib/components/form/Select.svelte';
    import moodleLecturerLinkIcon from '$lib/assets/moodleLecturerLinkIcon.jpg';
    import { createExtendedScheduleItemProvider } from '$lib/utils';

    const {
        savedScheduleSetsStore,
        preferredScheduleViewStore,
        snackbarStore,
        cookieStore,
        nowStore
    } = getGlobalContext();
    const { data } = $props();

    const scheduleTypeLabels = $derived(SCHEDULE_TYPE_TO_LABELS[data.scheduleType]);

    // TODO: allow shallow navigation when changing schedule view
    const currentScheduleView = $derived({
        value: ($page.params.view as ScheduleView | undefined) ?? $preferredScheduleViewStore,
        isReflectedInUrl: !!$page.params.view
    });
    const CurrentScheduleViewComponent = $derived(
        {
            agenda: ScheduleViewAgenda,
            week: ScheduleViewWeek,
            table: ScheduleViewTable,
            ical: ScheduleViewICal
        }[currentScheduleView.value]
    );

    const periodPicklistOptions = $derived.by(() => {
        const periodOptionsDateFormatter = new Intl.DateTimeFormat(languageTag(), {
            timeZone: UEK_TIME_ZONE,
            dateStyle: 'medium'
        });

        return data.periods.map((period, i) => ({
            value: i.toString(),
            label: periodOptionsDateFormatter.formatRange(
                new Date(period.from),
                new Date(period.to)
            )
        }));
    });
    const scheduleViewPicklistOptions = $derived(
        SCHEDULE_VIEWS.map((scheduleView) => ({
            value: scheduleView,
            label: SCHEDULE_VIEW_TO_LABEL[scheduleView]()
        }))
    );

    const currentScheduleSetCombinedName = $derived(
        data.headers.map((scheduleHeader) => scheduleHeader.name).join(', ')
    );
    const currentScheduleSetKey = $derived(getSavedScheduleSetKey(data.headers));
    const isCurrentScheduleSetSaved = $derived(
        $savedScheduleSetsStore.isSaved(data.scheduleType, currentScheduleSetKey)
    );

    const extendedScheduleItems = $derived.by(() => {
        const createExtendedScheduleItem = createExtendedScheduleItemProvider($nowStore);
        return data.items.map((scheduleItem) => createExtendedScheduleItem(scheduleItem));
    });
</script>

<PageMetadata
    titleParts={[data.headers.map((schedule) => schedule.name).join(', ')]}
    description={m.metaPageDescriptionSchedule({
        schedules: data.headers.map((schedule) => schedule.name).join(', ')
    })}
    disallowRobots={data.headers.length > 1 || currentScheduleView.isReflectedInUrl}
/>
<div class="mb-4 flex flex-col justify-between gap-2 sm:gap-4 xl:flex-row">
    <div class="flex flex-wrap gap-4 sm:justify-between xl:justify-start">
        <div class="flex flex-col flex-wrap gap-1 sm:flex-row sm:gap-2 lg:flex-nowrap lg:gap-4">
            {#each data.headers as header}
                <div class="flex flex-wrap items-center">
                    <span class="text-lg font-bold md:text-2xl 2xl:text-3xl">{header.name}</span>
                    {#if header.moodleId}
                        <a
                            class="ml-2.5 text-accent hover:underline"
                            href={createMoodleURL(header.moodleId)}
                            title={m.moodleLinkTitle({
                                lecturerName: header.name
                            })}
                            target="_blank"
                            rel="noopener"
                        >
                            <img
                                class="h-3 sm:h-4"
                                src={moodleLecturerLinkIcon}
                                alt={m.moodleLinkTitle({
                                    lecturerName: header.name
                                })}
                            />
                        </a>
                    {/if}
                    {#if data.headers.length > 1}
                        <a
                            class="ml-1.5 items-center rounded-sm p-1.5 text-sm transition-colors hover:bg-secondary hover:underline"
                            href={createScheduleURL({
                                scheduleType: data.scheduleType,
                                scheduleIds: data.headers
                                    .filter((h) => h !== header)
                                    .map((h) => h.id),
                                periodIndex: data.currentPeriodIndex,
                                scheduleView: currentScheduleView.isReflectedInUrl
                                    ? currentScheduleView.value
                                    : undefined
                            })}
                            title={m.removeSchedule({
                                schedule: header.name
                            })}
                        >
                            <Icon
                                class="max-h-3 max-w-3 sm:max-h-4 sm:max-w-4"
                                iconName="cross"
                                ariaHidden
                            />
                            <span class="sr-only">
                                {m.removeSchedule({
                                    schedule: header.name
                                })}
                            </span>
                        </a>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="flex gap-2 text-sm sm:text-base">
            {#if data.headers.length === 1}
                <Button
                    href={createSchedulePickerURL({
                        scheduleType: data.scheduleType
                    })}
                    variant="outline"
                    nofollow
                    label={scheduleTypeLabels.documentTitle()}
                    iconName="chevronDown"
                />
            {/if}
            {#if data.headers.length < MAX_SELECTABLE_SCHEDULES}
                <Button
                    href={createSchedulePickerURL({
                        scheduleType: data.scheduleType,
                        pickerState: {
                            periodIndex: data.currentPeriodIndex,
                            scheduleIds: data.headers.map((header) => header.id)
                        }
                    })}
                    variant="outline"
                    nofollow
                    label={scheduleTypeLabels.documentTitleMore()}
                    iconName="plus"
                />
            {/if}
            {#if $cookieStore.areCookiesAllowed()}
                <form
                    class="ml-auto flex rounded-full transition-colors hover:bg-secondary"
                    action={isCurrentScheduleSetSaved
                        ? '?/removeSavedScheduleSet'
                        : '?/addSavedScheduleSet'}
                    method="POST"
                    onsubmit={(e) => {
                        e.preventDefault();

                        if (isCurrentScheduleSetSaved) {
                            savedScheduleSetsStore.remove(data.scheduleType, currentScheduleSetKey);
                            snackbarStore.show({
                                message: m.snackbarScheduleRemoveMessage({
                                    scheduleSet: currentScheduleSetCombinedName
                                })
                            });
                        } else {
                            savedScheduleSetsStore.add(data.scheduleType, data.headers);
                            snackbarStore.show({
                                message: m.snackbarScheduleSavedMessage({
                                    scheduleSet: currentScheduleSetCombinedName
                                })
                            });
                        }
                    }}
                >
                    <input name="headers" type="hidden" value={JSON.stringify(data.headers)} />
                    <button
                        class="p-1"
                        type="submit"
                        title={isCurrentScheduleSetSaved
                            ? m.removeScheduleSetFromSavedScheduleSets({
                                  scheduleSet: currentScheduleSetCombinedName
                              })
                            : m.addScheduleSetToSavedScheduleSets({
                                  scheduleSet: currentScheduleSetCombinedName
                              })}
                    >
                        <Icon
                            class="h-7 w-7"
                            iconName={isCurrentScheduleSetSaved ? 'bookmark' : 'bookmarkOutline'}
                        />
                        <span class="sr-only">
                            {isCurrentScheduleSetSaved
                                ? m.removeScheduleSetFromSavedScheduleSets({
                                      scheduleSet: currentScheduleSetCombinedName
                                  })
                                : m.addScheduleSetToSavedScheduleSets({
                                      scheduleSet: currentScheduleSetCombinedName
                                  })}
                        </span>
                    </button>
                </form>
            {/if}
        </div>
    </div>

    <form
        action="?/setPeriodAndView"
        method="POST"
        class="flex min-w-[25%] flex-wrap gap-2 sm:flex-nowrap sm:gap-4 2xl:min-w-[30%] 3xl:min-w-[35%]"
    >
        <Select
            name={SEARCH_PARAM.SCHEDULE.PERIOD}
            title={m.scheduleViewPeriodPickerTitle()}
            disabled={!!$navigating}
            variant="underline"
            options={periodPicklistOptions}
            value={data.currentPeriodIndex.toString()}
            onchange={(e) => {
                e.preventDefault();

                goto(
                    i18n.resolveRoute(
                        createScheduleURL({
                            scheduleType: data.scheduleType,
                            scheduleIds: data.headers.map((header) => header.id),
                            periodIndex: parseInt(e.currentTarget.value),
                            scheduleView: currentScheduleView.isReflectedInUrl
                                ? currentScheduleView.value
                                : undefined
                        })
                    )
                );
            }}
        />
        <Select
            name={SEARCH_PARAM.SCHEDULE.VIEW}
            title={m.scheduleViewViewPickerTitle()}
            disabled={!!$navigating}
            variant="underline"
            value={currentScheduleView.value}
            options={scheduleViewPicklistOptions}
            onchange={(e) => {
                e.preventDefault();
                const newScheduleView = e.currentTarget.value as ScheduleView;

                preferredScheduleViewStore.set(newScheduleView);
                goto(
                    i18n.resolveRoute(
                        createScheduleURL({
                            scheduleType: data.scheduleType,
                            scheduleIds: data.headers.map((header) => header.id),
                            periodIndex: data.currentPeriodIndex,
                            scheduleView: newScheduleView
                        })
                    ),
                    {}
                );
            }}
        />
        <noscript>
            <Button label={m.chooseGeneric()} variant="underline" class="w-min" />
        </noscript>
    </form>
</div>

{#if data.items.length > 0}
    <CurrentScheduleViewComponent
        headers={data.headers}
        scheduleItems={extendedScheduleItems}
        scheduleType={data.scheduleType}
        currentPeriod={data.periods[data.currentPeriodIndex] as Schedule['periods'][number]}
    />
    {#if currentScheduleView.value !== 'ical' && data.currentPeriodIndex === 0}
        <div class="my-2 flex items-center gap-3">
            <Icon class="max-h-7 max-w-7" iconName="alert" ariaHidden />
            <span>
                {m.scheduleChangePeriodHint({
                    current:
                        periodPicklistOptions.find(
                            (option) => option.value === data.currentPeriodIndex.toString()
                        )?.label ?? ''
                })}
            </span>
        </div>
    {/if}
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
                scheduleType: data.scheduleType,
                periodIndex: data.currentPeriodIndex
            }).toString()}
            title={header.name}
            target="_blank"
            rel="noopener"
        >
            {header.name}
        </a>
    {/each}
</div>
