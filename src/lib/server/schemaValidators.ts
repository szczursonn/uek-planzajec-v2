import { z } from 'zod';
import { MAX_SELECTABLE_SCHEDULES, SCHEDULE_TYPES, SCHEDULE_VIEWS } from '$lib/consts';

export const scheduleTypeSchema = z.enum(SCHEDULE_TYPES);
export const originalScheduleTypeSchema = z.enum(['G', 'N', 'S']);

export const scheduleGroupingSchema = z.object({
    name: z.string().min(1),
    type: scheduleTypeSchema
});

export const scheduleHeaderSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1)
});

export const favoriteScheduleSchema = scheduleHeaderSchema.extend({
    type: scheduleTypeSchema
});

export const favoriteScheduleArraySchema = z.array(favoriteScheduleSchema);

export const scheduleSchema = z
    .object({
        id: z.string().min(1),
        type: scheduleTypeSchema,
        name: z.string().min(1),
        moodleId: z.optional(z.string().min(1)),
        selectedPeriod: z.number().int().nonnegative(),
        periods: z.array(
            z.object({
                from: z.string().date(),
                to: z.string().date()
            })
        ),
        items: z.array(
            z
                .object({
                    start: z.string().datetime(),
                    end: z.string().datetime(),
                    subject: z.string(),
                    type: z.string().min(1),
                    room: z.string().min(1).optional(),
                    roomUrl: z.string().url().optional(),
                    lecturers: z.array(
                        z.object({
                            name: z.string().min(1).optional(),
                            moodleId: z.string().min(1).optional()
                        })
                    ),
                    groups: z.array(z.string().min(1)),
                    extra: z.string().min(1).optional()
                })
                .refine((item) => item.end >= item.start, 'end must be after start')
        )
    })
    .refine(
        (result) => result.periods.length > result.selectedPeriod,
        'selectedPeriod should be an index of periods'
    );

export const scheduleViewSchema = z.enum(SCHEDULE_VIEWS);

export const pickerStateSchema = z.object({
    period: z.number().nonnegative(),
    ids: z.array(z.string().min(1)).min(1).max(MAX_SELECTABLE_SCHEDULES)
});
export const parsePickerState = (value: unknown) => {
    if (typeof value !== 'string') {
        return;
    }

    try {
        return pickerStateSchema.parse(JSON.parse(atob(value)));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
        return;
    }
};
