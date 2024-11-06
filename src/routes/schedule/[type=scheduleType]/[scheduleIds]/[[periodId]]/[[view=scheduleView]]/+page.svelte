<script lang="ts">
    import { navigating, page } from '$app/stores';
    import { goto } from '$app/navigation';
    import * as m from '$lib/paraglide/messages';
    import { i18n } from '$lib/i18n';
    import type { SchedulePeriod, ScheduleView } from '$lib/types';
    import {
        MAX_SELECTABLE_SCHEDULES,
        SCHEDULE_VIEWS,
        SCHEDULE_VIEW_TO_LABEL,
        SEARCH_PARAM
    } from '$lib/consts';
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
    import { extendAggregateSchedule } from '$lib/utils';

    const {
        savedScheduleSetsStore,
        preferredScheduleViewStore,
        snackbarStore,
        cookieStore,
        nowStore
    } = getGlobalContext();
    const { data } = $props();

    const extendedAggregateSchedule = $derived(
        extendAggregateSchedule(data.aggregateSchedule, $nowStore)
    );

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

    const scheduleViewPicklistOptions = $derived(
        SCHEDULE_VIEWS.map((scheduleView) => ({
            value: scheduleView,
            label: SCHEDULE_VIEW_TO_LABEL[scheduleView]()
        }))
    );

    const isCurrentScheduleSetSaved = $derived(
        $savedScheduleSetsStore.isSaved(
            extendedAggregateSchedule.type,
            extendedAggregateSchedule.key
        )
    );
</script>

<PageMetadata
    titleParts={[extendedAggregateSchedule.displayName]}
    description={m.metaPageDescriptionSchedule({
        schedules: extendedAggregateSchedule.displayName
    })}
    disallowRobots={extendedAggregateSchedule.headers.length > 1 ||
        currentScheduleView.isReflectedInUrl}
/>
<div class="mb-4 flex flex-col justify-between gap-2 sm:gap-4 2xl:flex-row">
    <div class="flex flex-wrap gap-4 sm:justify-between 2xl:justify-start">
        <div class="flex flex-col flex-wrap gap-1 sm:flex-row sm:gap-2 lg:flex-nowrap lg:gap-4">
            {#each extendedAggregateSchedule.headers as header}
                <div class="flex flex-wrap items-center">
                    <span class="text-lg font-bold md:text-2xl 3xl:text-3xl">{header.name}</span>
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
                    {#if extendedAggregateSchedule.headers.length > 1}
                        <a
                            class="ml-1.5 items-center rounded-sm p-1.5 text-sm transition-colors hover:bg-secondary hover:underline"
                            href={createScheduleURL({
                                scheduleType: extendedAggregateSchedule.type,
                                scheduleIds: extendedAggregateSchedule.headers
                                    .filter((h) => h !== header)
                                    .map((h) => h.id),
                                schedulePeriod: extendedAggregateSchedule.period,
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
            {#if extendedAggregateSchedule.headers.length === 1}
                <Button
                    href={createSchedulePickerURL({
                        scheduleType: extendedAggregateSchedule.type
                    })}
                    variant="outline"
                    nofollow
                    label={extendedAggregateSchedule.typeLabels.documentTitle()}
                    iconName="chevronDown"
                />
            {/if}
            {#if extendedAggregateSchedule.headers.length < MAX_SELECTABLE_SCHEDULES}
                <Button
                    href={createSchedulePickerURL({
                        scheduleType: extendedAggregateSchedule.type,
                        pickerState: {
                            scheduleIds: extendedAggregateSchedule.headers.map(
                                (header) => header.id
                            ),
                            schedulePeriod: extendedAggregateSchedule.period
                        }
                    })}
                    variant="outline"
                    nofollow
                    label={extendedAggregateSchedule.typeLabels.documentTitleMore()}
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
                            savedScheduleSetsStore.remove(
                                extendedAggregateSchedule.type,
                                extendedAggregateSchedule.key
                            );
                            snackbarStore.show({
                                message: m.snackbarScheduleRemoveMessage({
                                    scheduleSet: extendedAggregateSchedule.displayName
                                })
                            });
                        } else {
                            savedScheduleSetsStore.add(
                                extendedAggregateSchedule.type,
                                extendedAggregateSchedule.headers
                            );
                            snackbarStore.show({
                                message: m.snackbarScheduleSavedMessage({
                                    scheduleSet: extendedAggregateSchedule.displayName
                                })
                            });
                        }
                    }}
                >
                    <input
                        name="headers"
                        type="hidden"
                        value={JSON.stringify(extendedAggregateSchedule.headers)}
                    />
                    <button
                        class="p-1"
                        type="submit"
                        disabled={!isCurrentScheduleSetSaved &&
                            $savedScheduleSetsStore.isLimitReached()}
                        title={isCurrentScheduleSetSaved
                            ? m.removeScheduleSetFromSavedScheduleSets({
                                  scheduleSet: extendedAggregateSchedule.displayName
                              })
                            : m.addScheduleSetToSavedScheduleSets({
                                  scheduleSet: extendedAggregateSchedule.displayName
                              })}
                    >
                        <Icon
                            class="h-7 w-7"
                            iconName={isCurrentScheduleSetSaved ? 'bookmark' : 'bookmarkOutline'}
                        />
                        <span class="sr-only">
                            {isCurrentScheduleSetSaved
                                ? m.removeScheduleSetFromSavedScheduleSets({
                                      scheduleSet: extendedAggregateSchedule.displayName
                                  })
                                : m.addScheduleSetToSavedScheduleSets({
                                      scheduleSet: extendedAggregateSchedule.displayName
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
        class="flex min-w-[25%] flex-wrap gap-2 sm:flex-nowrap sm:gap-4 2xl:min-w-[35%]"
    >
        <Select
            name={SEARCH_PARAM.SCHEDULE.PERIOD}
            title={m.scheduleViewPeriodPickerTitle()}
            disabled={!!$navigating}
            variant="underline"
            options={extendedAggregateSchedule.periodOptions}
            value={extendedAggregateSchedule.period}
            onchange={(e) => {
                e.preventDefault();

                goto(
                    i18n.resolveRoute(
                        createScheduleURL({
                            scheduleType: extendedAggregateSchedule.type,
                            scheduleIds: extendedAggregateSchedule.headers.map(
                                (header) => header.id
                            ),
                            schedulePeriod: e.currentTarget.value as SchedulePeriod,
                            scheduleView: currentScheduleView.isReflectedInUrl
                                ? currentScheduleView.value
                                : undefined
                        })
                    )
                );
            }}
        />
        <Select
            class="2xl:max-w-fit"
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
                            scheduleType: extendedAggregateSchedule.type,
                            scheduleIds: extendedAggregateSchedule.headers.map(
                                (header) => header.id
                            ),
                            schedulePeriod: extendedAggregateSchedule.period,
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

{#if extendedAggregateSchedule.items.length > 0}
    <CurrentScheduleViewComponent {extendedAggregateSchedule} />
{:else}
    <div class="my-8 text-center text-lg font-semibold">{m.emptyScheduleMessage()}</div>
{/if}

<hr class="mt-4 border-secondary" />
<div class="mt-4 flex flex-col gap-1">
    <span class="text-xl">
        {extendedAggregateSchedule.headers.length === 1
            ? m.originalSchedule()
            : m.originalSchedules()}
    </span>
    {#each extendedAggregateSchedule.headers as header}
        <a
            class="max-w-min text-nowrap font-semibold text-accent hover:underline"
            href={createOriginalURL({
                scheduleId: header.id,
                scheduleType: extendedAggregateSchedule.type,
                schedulePeriod: extendedAggregateSchedule.period
            }).toString()}
            title={header.name}
            target="_blank"
            rel="noopener"
        >
            {header.name}
        </a>
    {/each}
</div>
