import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import {
    scheduleHeaderSchema,
    scheduleSchema,
    scheduleGroupingSchema,
    originalScheduleTypeSchema
} from '$lib/server/schemaValidators';
import type { ScheduleType } from '$lib/types';
import { createOriginalURL, cutPostfix } from '$lib/utils';
import { getDateFromLocalParts } from '$lib/dateUtils';
import { SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED, CACHE_MAX_AGE_SECONDS } from '$lib/consts';

const USER_AGENT =
    'Mozilla/5.0 (compatible; uek-planzajec-v2/1.0; +https://uek-planzajec-v2.pages.dev/)';

const coerceEmptyStringToUndefined = <T>(value: T) =>
    typeof value === 'string' && value.length === 0 ? undefined : value;

const xmlTagsToParseAsArray = new Set(['grupowanie', 'zasob', 'zajecia', 'okres', 'nauczyciel']);

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    alwaysCreateTextNode: true,
    isArray: (tag) => xmlTagsToParseAsArray.has(tag)
});

const hourRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/;

const anchorTagXMLSchema = z.object({
    a: z.object({
        '#text': z.string(),
        '@_href': z.string().url()
    })
});

const scheduleGroupingXMLSchema = z.object({
    'plan-zajec': z.object({
        grupowanie: z.array(
            z.object({
                '@_typ': originalScheduleTypeSchema,
                '@_grupa': z.string().min(1)
            })
        )
    })
});

const scheduleHeaderXMLSchema = z.object({
    'plan-zajec': z.object({
        zasob: z.array(
            z.object({
                '@_id': z.string().min(1),
                '@_nazwa': z.string().min(1)
            })
        )
    })
});

const scheduleXMLSchema = z.object({
    'plan-zajec': z.object({
        '@_typ': originalScheduleTypeSchema,
        '@_id': z.string().min(1),
        '@_idcel': z.optional(z.string().min(2)),
        '@_nazwa': z.string().min(1),
        okres: z
            .array(
                z.object({
                    '@_od': z.string().date(),
                    '@_do': z.string().date(),
                    '@_wybrany': z.literal('tak').optional()
                })
            )
            .min(1),
        zajecia: z
            .array(
                z.object({
                    termin: z.object({
                        '#text': z.string().date()
                    }),
                    'od-godz': z.object({
                        '#text': z.string().regex(hourRegex)
                    }),
                    'do-godz': z.object({
                        '#text': z.string().regex(hourRegex)
                    }),
                    przedmiot: z.object({
                        '#text': z.string()
                    }),
                    typ: z.object({
                        '#text': z.string().min(1)
                    }),
                    nauczyciel: z
                        .array(
                            z.object({
                                '#text': z.string(),
                                '@_moodle': z.string().optional()
                            })
                        )
                        .optional(),
                    sala: z
                        .object({
                            '#text': z.string()
                        })
                        .optional(),
                    grupa: z
                        .object({
                            '#text': z.string()
                        })
                        .optional(),
                    uwagi: z
                        .object({
                            '#text': z.string()
                        })
                        .optional()
                })
            )
            .optional()
    })
});

const parseUEKDate = (dateString: string, timeString?: string) => {
    const dateStringParts = dateString.split('-').map((part) => parseInt(part));
    const timeStringParts = timeString?.split(':').map((part) => parseInt(part)) ?? [];

    if (dateStringParts.length < 3 || !dateStringParts.every((part) => isFinite(part))) {
        throw new Error(`Invalid date string: ${dateString}`);
    }

    if (!timeStringParts.every((part) => isFinite(part))) {
        throw new Error(`Invalid time string: ${timeString}`);
    }

    return getDateFromLocalParts({
        year: dateStringParts[0]!,
        month: dateStringParts[1]!,
        day: dateStringParts[2]!,
        hour: timeStringParts[0],
        minute: timeStringParts[1]
    });
};

export const getUEKApiClient = (platform?: App.Platform) => {
    const callUEKApi = async (url: URL, cacheMaxAgeSeconds: number) => {
        let response = await platform?.caches.default.match(url);
        console.log(`[CACHE ${response ? 'HIT' : 'MISS'}] ${url}`);

        if (!response) {
            response = await fetch(url, {
                headers: {
                    'User-Agent': USER_AGENT
                }
            });

            if (!response.ok) {
                throw new Error(`Server responded with non-200 response: ${response.statusText}`);
            }

            if (platform) {
                response = new Response(response.body, response);
                response.headers.set('Cache-Control', `s-maxage=${cacheMaxAgeSeconds}`);
                platform.context.waitUntil(platform.caches.default.put(url, response.clone()));
            }
        }

        return xmlParser.parse(await response.text()) as unknown;
    };

    const getScheduleGroupings = async () => {
        const xmlScheduleGroupings = scheduleGroupingXMLSchema.parse(
            await callUEKApi(
                createOriginalURL({
                    xml: true
                }),
                CACHE_MAX_AGE_SECONDS.GROUPINGS
            )
        )['plan-zajec'].grupowanie;

        return z.array(scheduleGroupingSchema).parse(
            xmlScheduleGroupings.map((row) => ({
                name: row['@_grupa'],
                type: SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED[row['@_typ']]
            }))
        );
    };

    const getScheduleHeaders = async (scheduleType: ScheduleType, grouping?: string) => {
        const xmlScheduleHeaders = scheduleHeaderXMLSchema.parse(
            await callUEKApi(
                createOriginalURL({
                    scheduleType,
                    grouping,
                    xml: true
                }),
                CACHE_MAX_AGE_SECONDS.HEADERS
            )
        )['plan-zajec'].zasob;

        return xmlScheduleHeaders.map((row) =>
            scheduleHeaderSchema.parse({
                id: row['@_id'],
                name: cutPostfix(row['@_nazwa'], ',')
            })
        );
    };

    const getSchedule = async (scheduleId: string, scheduleType: ScheduleType, period: number) => {
        const xmlSchedule = scheduleXMLSchema.parse(
            await callUEKApi(
                createOriginalURL({
                    scheduleType,
                    scheduleId,
                    period,
                    xml: true
                }),
                CACHE_MAX_AGE_SECONDS.SCHEDULE
            )
        )['plan-zajec'];

        const parsedSchedule = scheduleSchema.parse({
            id: xmlSchedule['@_id'],
            type: SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED[xmlSchedule['@_typ']],
            name: xmlSchedule['@_nazwa'],
            moodleId: xmlSchedule['@_idcel']?.substring(1),
            selectedPeriod: xmlSchedule.okres.findIndex((row) => row['@_wybrany'] === 'tak'),
            periods: xmlSchedule.okres.map((row) => ({
                from: parseUEKDate(row['@_od']).toISOString(),
                to: parseUEKDate(row['@_do']).toISOString()
            })),
            items:
                xmlSchedule.zajecia?.map((row) => {
                    let room: Record<string, unknown> | undefined;

                    if (xmlSchedule['@_typ'] === 'S') {
                        room = {
                            name: xmlSchedule['@_nazwa']
                        };
                    } else if (row.sala?.['#text'].startsWith('<a')) {
                        const anchorTag = anchorTagXMLSchema.parse(
                            xmlParser.parse(row.sala['#text'])
                        ).a;
                        room = {
                            name: anchorTag['#text'],
                            url: anchorTag['@_href']
                        };
                    } else if (row.sala?.['#text']) {
                        room = {
                            name: row.sala?.['#text']
                        };
                    }

                    return {
                        start: parseUEKDate(
                            row.termin['#text'],
                            row['od-godz']['#text']
                        ).toISOString(),
                        end: parseUEKDate(
                            row.termin['#text'],
                            row['do-godz']['#text'].substring(0, 5)
                        ).toISOString(),
                        subject: row.przedmiot['#text'],
                        type: row.typ['#text'],
                        room,
                        lecturers:
                            xmlSchedule['@_typ'] === 'N'
                                ? [
                                      {
                                          name: xmlSchedule['@_nazwa'],
                                          moodleId: xmlSchedule['@_idcel']?.substring(1)
                                      }
                                  ]
                                : row.nauczyciel
                                      ?.filter((row) => row['#text'])
                                      .map((row) => ({
                                          name: row['#text'],
                                          moodleId: row['@_moodle']?.substring(1)
                                      })),
                        groups:
                            xmlSchedule['@_typ'] === 'G'
                                ? [xmlSchedule['@_nazwa']]
                                : row.grupa?.['#text'].split(', ').filter(Boolean),
                        extra: coerceEmptyStringToUndefined(row.uwagi?.['#text'])
                    };
                }) ?? []
        });

        return parsedSchedule;
    };

    return {
        getScheduleGroupings,
        getScheduleHeaders,
        getSchedule
    };
};
