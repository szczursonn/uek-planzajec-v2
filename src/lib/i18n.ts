import { createI18n } from '@inlang/paraglide-sveltekit';
import * as runtime from '$lib/paraglide/runtime';
import * as m from '$lib/paraglide/messages';
import { SCHEDULE_TYPE_TO_LABELS, SCHEDULE_VIEW_TO_LABEL } from '$lib/consts';

// replaces regional characters with english ones
const normalizeLabel = (label: string) =>
    label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replaceAll('(', '')
        .replaceAll(/[()]/g, '')
        .replaceAll(/\s/g, '-');

export const i18n = createI18n(runtime, {
    pathnames: Object.entries(SCHEDULE_TYPE_TO_LABELS).reduce(
        (
            acc,
            [scheduleType, { default: scheduleTypeLabel, tabName: scheduleTypeMultipleLabel }]
        ) => ({
            ...acc,
            [`/${scheduleType}/[[grouping]]`]: (
                ...args: Parameters<typeof scheduleTypeMultipleLabel>
            ) => `/${normalizeLabel(scheduleTypeMultipleLabel(...args))}/[[grouping]]`,
            ...Object.entries(SCHEDULE_VIEW_TO_LABEL).reduce(
                (acc2, [scheduleView, scheduleViewLabel]) => ({
                    ...acc2,
                    [`/schedule/${scheduleType}/[scheduleIds]/[[periodIndex]]/${scheduleView}`]: (
                        ...args: Parameters<
                            typeof scheduleTypeLabel | typeof scheduleViewLabel | typeof m.schedule
                        >
                    ) =>
                        `/${normalizeLabel(m.schedule(...args))}/${normalizeLabel(scheduleTypeLabel(...args))}/[scheduleIds]/[[periodIndex]]/${normalizeLabel(scheduleViewLabel(...args))}`,
                    [`/schedule/${scheduleType}/[scheduleIds]/[[periodIndex]]`]: (
                        ...args: Parameters<typeof scheduleTypeLabel | typeof m.schedule>
                    ) =>
                        `/${normalizeLabel(m.schedule(...args))}/${normalizeLabel(scheduleTypeLabel(...args))}/[scheduleIds]/[[periodIndex]]`,
                    [`/schedule/${scheduleType}/[scheduleIds]`]: (
                        ...args: Parameters<typeof scheduleTypeLabel>
                    ) =>
                        `/${normalizeLabel(m.schedule(...args))}/${normalizeLabel(scheduleTypeLabel(...args))}/[scheduleIds]`
                }),
                {}
            )
        }),
        {}
    )
});
