import { z } from 'zod';
import {
    MAX_SAVED_SCHEDULE_SETS,
    MAX_SELECTABLE_SCHEDULES,
    SCHEDULE_PERIODS,
    SCHEDULE_TYPES,
    SCHEDULE_VIEWS
} from '$lib/consts';

export const scheduleTypeSchema = z.enum(SCHEDULE_TYPES);
export const originalScheduleTypeSchema = z.enum(['G', 'N', 'S']);

export const scheduleIdSchema = z.string().min(1).regex(/^\d+$/);
export const scheduleNameSchema = z.string().min(1);

export const schedulePeriodSchema = z.enum(SCHEDULE_PERIODS);

export const scheduleGroupingSchema = z.object({
    name: scheduleNameSchema,
    type: scheduleTypeSchema
});

export const scheduleHeaderSchema = z.object({
    id: scheduleIdSchema,
    name: scheduleNameSchema
});

export const aggregateScheduleSchema = z
    .object({
        headers: z
            .array(
                scheduleHeaderSchema.extend({
                    moodleId: z.string().min(1).optional()
                })
            )
            .min(1)
            .max(MAX_SELECTABLE_SCHEDULES),
        type: scheduleTypeSchema,
        period: schedulePeriodSchema,
        periodOptions: z.array(
            z.object({
                id: schedulePeriodSchema,
                start: z.string().datetime(),
                end: z.string().datetime()
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
                .refine((item) => item.end >= item.start, 'schedule item end must be after start')
        )
    })
    .refine(
        (aggregateSchedule) =>
            aggregateSchedule.periodOptions.some(
                (periodOption) => periodOption.id === aggregateSchedule.period
            ),
        'aggregate schedules period must be included in periodOptions'
    );

export const scheduleViewSchema = z.enum(SCHEDULE_VIEWS);

export const pickerStateSchema = z.object({
    scheduleIds: z.array(scheduleIdSchema).min(1).max(MAX_SELECTABLE_SCHEDULES),
    schedulePeriod: schedulePeriodSchema
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
