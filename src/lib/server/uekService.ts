import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import {
    scheduleGroupingSchema,
    scheduleHeaderSchema,
    aggregateScheduleSchema,
    originalScheduleTypeSchema
} from '$lib/server/schema';
import type { ScheduleType, SchedulePeriod, ScheduleItem, DateParts } from '$lib/types';
import { areDatePartsEqual, compareDateParts, cutPostfix } from '$lib/utils';
import { getLocalDateParts, getDateWithoutLocalTime } from '$lib/dateUtils';
import { createOriginalURL } from '$lib/linkUtils';
import {
    SCHEDULE_PERIOD_TO_CONFIG,
    SCHEDULE_PERIODS,
    SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED
} from '$lib/consts';

const USER_AGENT =
    'Mozilla/5.0 (compatible; uek-planzajec-v2/1.0; +https://uek-planzajec-v2.pages.dev/)';

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    alwaysCreateTextNode: true,
    isArray: (() => {
        const xmlTagsToParseAsArray = new Set([
            'grupowanie',
            'zasob',
            'zajecia',
            'okres',
            'nauczyciel'
        ]);
        return (tag) => xmlTagsToParseAsArray.has(tag);
    })()
});

const hourRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/;

const fetchXML = async ({ url }: { url: URL }) => {
    const response = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT
        }
    });

    if (!response.ok) {
        throw new Error(
            `Server responded with non-200 response: ${response.status} ${response.statusText}`
        );
    }

    return xmlParser.parse(await response.text()) as unknown;
};

const getUEKDateParts = (dateString: string, timeString: string) => {
    const dateStringParts = dateString.split('-').map((part) => parseInt(part));
    const timeStringParts = timeString?.split(':').map((part) => parseInt(part)) ?? [];

    return [
        dateStringParts[0]!,
        dateStringParts[1]!,
        dateStringParts[2]!,
        timeStringParts[0] ?? 0,
        timeStringParts[1] ?? 0
    ] as DateParts;
};

const parseScheduleGroupingsResponse = (xmlResponse: unknown) =>
    z
        .object({
            'plan-zajec': z.object({
                grupowanie: z.array(
                    z.object({
                        '@_typ': originalScheduleTypeSchema,
                        '@_grupa': z.string().min(1)
                    })
                )
            })
        })
        .transform((parsedXml) =>
            parsedXml['plan-zajec'].grupowanie.map((xmlScheduleGrouping) => ({
                name: xmlScheduleGrouping['@_grupa'],
                type: SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED[xmlScheduleGrouping['@_typ']]
            }))
        )
        .pipe(z.array(scheduleGroupingSchema))
        .parse(xmlResponse);

const parseScheduleHeadersResponse = (xmlResponse: unknown) =>
    z
        .object({
            'plan-zajec': z.object({
                zasob: z.array(
                    z.object({
                        '@_id': z.string().min(1),
                        '@_nazwa': z.string().min(1)
                    })
                )
            })
        })
        .transform((parsedXml) =>
            parsedXml['plan-zajec'].zasob.map((xmlScheduleHeader) => ({
                id: xmlScheduleHeader['@_id'],
                name: cutPostfix(xmlScheduleHeader['@_nazwa'], ',')
            }))
        )
        .pipe(z.array(scheduleHeaderSchema))
        .parse(xmlResponse);

// TODO: refactor this shit
const processScheduleResponses = ({
    xmlResponses,
    selectedSchedulePeriod,
    now
}: {
    xmlResponses: unknown[];
    selectedSchedulePeriod: SchedulePeriod;
    now: Date;
}) =>
    z
        .array(
            z.object({
                'plan-zajec': z.object({
                    '@_typ': originalScheduleTypeSchema,
                    '@_id': z.string().min(1),
                    '@_idcel': z.optional(z.string().min(2)),
                    '@_nazwa': z.string().min(1),
                    okres: z
                        .array(
                            z.object({
                                '@_od': z.string().date(),
                                '@_do': z.string().date()
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
            })
        )
        .transform((xmlSchedules) => {
            const scheduleType =
                SCHEDULE_TYPE_ORIGINAL_TO_NORMALIZED[xmlSchedules[0]!['plan-zajec']['@_typ']];

            const periodOptions = SCHEDULE_PERIODS.map((schedulePeriod) => ({
                id: schedulePeriod,
                startParts:
                    schedulePeriod === 'upcoming'
                        ? getLocalDateParts(getDateWithoutLocalTime(now))
                        : getUEKDateParts(
                              xmlSchedules[0]!['plan-zajec'].okres[
                                  SCHEDULE_PERIOD_TO_CONFIG[schedulePeriod].originalId - 1
                              ]!['@_od'],
                              '00:00'
                          ),
                endParts: getUEKDateParts(
                    xmlSchedules[0]!['plan-zajec'].okres[
                        SCHEDULE_PERIOD_TO_CONFIG[schedulePeriod].originalId - 1
                    ]!['@_do'],
                    '23:59'
                )
            }));
            const selectedPeriodOption = periodOptions.find(
                (periodOption) => periodOption.id === selectedSchedulePeriod
            )!;

            const items = xmlSchedules
                .flatMap(
                    (xmlSchedule) =>
                        xmlSchedule['plan-zajec'].zajecia?.map((xmlScheduleItem) => {
                            let room: ScheduleItem['room'];

                            if (scheduleType === 'room') {
                                room = {
                                    name: xmlSchedule['plan-zajec']['@_nazwa']
                                };
                            } else if (xmlScheduleItem.sala?.['#text'].startsWith('<a')) {
                                const anchorTag = z
                                    .object({
                                        a: z.object({
                                            '#text': z.string(),
                                            '@_href': z.string().url()
                                        })
                                    })
                                    .parse(xmlParser.parse(xmlScheduleItem.sala['#text'])).a;
                                room = {
                                    name: anchorTag['#text'],
                                    url: anchorTag['@_href']
                                };
                            } else if (xmlScheduleItem.sala?.['#text']) {
                                room = {
                                    name: xmlScheduleItem.sala?.['#text']
                                };
                            }

                            return {
                                startParts: getUEKDateParts(
                                    xmlScheduleItem.termin['#text'],
                                    xmlScheduleItem['od-godz']['#text']
                                ),
                                endParts: getUEKDateParts(
                                    xmlScheduleItem.termin['#text'],
                                    xmlScheduleItem['do-godz']['#text'].substring(0, 5)
                                ),
                                subject: xmlScheduleItem.przedmiot['#text'],
                                type: xmlScheduleItem.typ['#text'],
                                room,
                                lecturers:
                                    scheduleType === 'lecturer'
                                        ? [
                                              {
                                                  name: xmlSchedule['plan-zajec']['@_nazwa'],
                                                  moodleId:
                                                      xmlSchedule['plan-zajec'][
                                                          '@_idcel'
                                                      ]?.substring(1)
                                              }
                                          ]
                                        : (xmlScheduleItem.nauczyciel
                                              ?.filter(
                                                  (xmlScheduleItemLecturer) =>
                                                      xmlScheduleItemLecturer['#text']
                                              )
                                              .map((xmlScheduleItemLecturer) => ({
                                                  name: xmlScheduleItemLecturer['#text'],
                                                  moodleId:
                                                      xmlScheduleItemLecturer[
                                                          '@_moodle'
                                                      ]?.substring(1)
                                              })) ?? []),
                                groups:
                                    scheduleType === 'group'
                                        ? [xmlSchedule['plan-zajec']['@_nazwa']]
                                        : (
                                              xmlScheduleItem.grupa?.['#text']
                                                  .split(', ')
                                                  .filter(Boolean) ?? []
                                          ).sort(),
                                extra: xmlScheduleItem.uwagi?.['#text'] || undefined
                            };
                        }) ?? []
                )
                .sort((a, b) => {
                    const compareDatePartsResult = compareDateParts(a.startParts, b.startParts);
                    if (compareDatePartsResult !== 0) {
                        return compareDatePartsResult;
                    }

                    if (a.subject > b.subject) {
                        return 1;
                    }

                    if (a.subject < b.subject) {
                        return -1;
                    }

                    return 0;
                })
                .reduce((items, item) => {
                    // Cleanup!
                    // 1. Remove language slots
                    // 2. Remove items starting before period or ending after period
                    // 3. Remove duplicates (same schedule item, but from different groups)

                    if (
                        (item.type !== 'lektorat' ||
                            (item.room?.name !== 'Wybierz swoją grupę językową' &&
                                (item.lecturers?.length !== 1 ||
                                    item.lecturers[0]?.name !== 'Językowe Centrum'))) &&
                        compareDateParts(selectedPeriodOption.startParts, item.startParts) !== 1 &&
                        compareDateParts(selectedPeriodOption.endParts, item.endParts) !== -1
                    ) {
                        const previousItem = items.at(-1);

                        if (
                            previousItem &&
                            previousItem.type === item.type &&
                            previousItem.subject === item.subject &&
                            areDatePartsEqual(previousItem.startParts, item.startParts) &&
                            areDatePartsEqual(previousItem.endParts, item.endParts) &&
                            previousItem.room?.name === item.room?.name &&
                            previousItem.room?.url === item.room?.url &&
                            previousItem.extra === item.extra &&
                            previousItem.lecturers?.length === item.lecturers?.length &&
                            previousItem.lecturers?.every(
                                (previousItemLecturer, i) =>
                                    previousItemLecturer.name === item.lecturers?.[i]?.name &&
                                    previousItemLecturer.moodleId === item.lecturers[i]?.moodleId
                            )
                        ) {
                            previousItem.groups = Array.from(
                                new Set([...previousItem.groups, ...item.groups])
                            ).sort();
                        } else {
                            items.push(item);
                        }
                    }

                    return items;
                }, [] as ScheduleItem[]);

            return {
                headers: xmlSchedules.map((xmlSchedule) => ({
                    id: xmlSchedule['plan-zajec']['@_id'],
                    name: xmlSchedule['plan-zajec']['@_nazwa'],
                    moodleId: xmlSchedule['plan-zajec']['@_idcel']?.substring(1)
                })),
                type: scheduleType,
                period: selectedSchedulePeriod,
                periodOptions,
                items
            };
        })
        .pipe(aggregateScheduleSchema)
        .parse(xmlResponses);

export const getScheduleGroupings = async () => {
    return parseScheduleGroupingsResponse(
        await fetchXML({
            url: createOriginalURL({
                xml: true
            })
        })
    );
};

export const getScheduleHeaders = async ({
    scheduleType,
    grouping
}: {
    scheduleType: ScheduleType;
    grouping?: string;
}) => {
    return parseScheduleHeadersResponse(
        await fetchXML({
            url: createOriginalURL({
                scheduleType,
                grouping,
                xml: true
            })
        })
    );
};

export const getAggregateSchedule = async ({
    scheduleIds,
    scheduleType,
    schedulePeriod,
    now
}: {
    scheduleIds: string[];
    scheduleType: ScheduleType;
    schedulePeriod: SchedulePeriod;
    now: Date;
}) => {
    return processScheduleResponses({
        xmlResponses: await Promise.all(
            scheduleIds.map((scheduleId) =>
                fetchXML({
                    url: createOriginalURL({
                        scheduleType,
                        scheduleId,
                        schedulePeriod,
                        xml: true
                    })
                })
            )
        ),
        selectedSchedulePeriod: schedulePeriod,
        now
    });
};
