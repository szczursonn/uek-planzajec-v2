import { z } from 'zod';
import {
    MAX_SAVED_SCHEDULE_SETS,
    MAX_SELECTABLE_SCHEDULES,
    SCHEDULE_TYPES,
    SCHEDULE_VIEWS
} from '$lib/consts';

export const scheduleTypeSchema = z.enum(SCHEDULE_TYPES);
export const originalScheduleTypeSchema = z.enum(['G', 'N', 'S']);

export const scheduleIdSchema = z.string().min(1).regex(/^\d+$/);
export const scheduleNameSchema = z.string().min(1);
export const scheduleSelectedPeriodSchema = z.number().int().nonnegative();

export const scheduleGroupingSchema = z.object({
    name: scheduleNameSchema,
    type: scheduleTypeSchema
});

export const scheduleHeaderSchema = z.object({
    id: scheduleIdSchema,
    name: scheduleNameSchema
});

export const scheduleSchema = z
    .object({
        id: scheduleIdSchema,
        type: scheduleTypeSchema,
        name: scheduleNameSchema,
        moodleId: z.optional(z.string().min(1)),
        selectedPeriod: scheduleSelectedPeriodSchema,
        periods: z.array(
            z.object({
                from: z.string().datetime(),
                to: z.string().datetime()
            })
        ),
        items: z.array(
            z
                .object({
                    start: z.string().datetime(),
                    end: z.string().datetime(),
                    subject: z.string(),
                    type: z.string().min(1),
                    room: z
                        .object({
                            name: z.string().min(1),
                            url: z.string().url().optional()
                        })
                        .optional(),
                    lecturers: z.array(
                        z.object({
                            name: z.string().min(1),
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
    periodIndex: scheduleSelectedPeriodSchema,
    scheduleIds: z.array(scheduleIdSchema).min(1).max(MAX_SELECTABLE_SCHEDULES)
});

export const savedScheduleSetsSchema = z.record(
    scheduleTypeSchema,
    z
        .array(z.array(scheduleHeaderSchema).min(1).max(MAX_SELECTABLE_SCHEDULES))
        .min(1)
        .max(MAX_SAVED_SCHEDULE_SETS)
);

export const cookieConsentStateSchema = z.object({
    version: z.number().int().nonnegative(),
    forceShowNotice: z.boolean()
});
