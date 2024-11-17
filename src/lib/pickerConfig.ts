import * as m from '$lib/paraglide/messages';
import type { ScheduleType } from '$lib/types';
import type { Options, OptionGroups } from '$lib/components/NestableLinkList.svelte';
import { SEARCH_PARAM } from '$lib/consts';
import { superParseInt } from '$lib/utils';

type FiltersConfig = ((
    | { type: 'search'; placeholder?: string }
    | { type: 'picklist'; options: { label?: string; value: string }[]; placeholder?: string }
) & { name: string })[];
type FilteredOptionGroupsProvider = (filters: Record<string, string>) => OptionGroups;
type PickerConfig = {
    filtersConfig: FiltersConfig;
    getFilteredOptionGroups: FilteredOptionGroupsProvider;
};

const STUDY_STAGE = {
    bachelor: {
        label: m.studyStageBachelor,
        order: 1
    },
    master: {
        label: m.studyStageMaster,
        order: 2
    },
    oneTier: {
        label: m.studyStageOneTier,
        order: 3
    }
} as const;

const STUDY_MODE = {
    'full-time': {
        label: m.studyModeWeekday,
        order: 1
    },
    'part-time': {
        label: m.studyModeWeekend,
        order: 2
    }
} as const;

const areValuesTruthyAndUnequal = (value1: unknown, value2: unknown) =>
    !!value1 && !!value2 && value1 !== value2;

const groupOptionsByFirstLetter = (options: Options) => {
    const firstLetterToOptions = new Map<string, typeof options>();

    for (const option of options) {
        const firstLetter = option.label.charAt(0).toUpperCase();

        const existingLetterOptions = firstLetterToOptions.get(firstLetter);
        if (existingLetterOptions) {
            existingLetterOptions.push(option);
        } else {
            firstLetterToOptions.set(firstLetter, [option]);
        }
    }

    return [...firstLetterToOptions.entries()].map(([firstLetter, options]) => ({
        label: firstLetter,
        options: options
    }));
};

const createSearchPhraseChecker = (searchPhrase?: string) => {
    searchPhrase = searchPhrase?.toLowerCase().trim();

    return searchPhrase
        ? (value: string) => value.toLowerCase().includes(searchPhrase)
        : () => true;
};

const createSearchOnlyPickerConfig = ({
    options,
    grouper,
    placeholder
}: {
    options: Options;
    grouper?: (filteredOptions: Options) => OptionGroups;
    placeholder?: string;
}): PickerConfig => ({
    filtersConfig:
        options.length > 0
            ? [
                  {
                      name: SEARCH_PARAM.PICKER.FILTER.SEARCH,
                      type: 'search',
                      placeholder
                  }
              ]
            : [],
    getFilteredOptionGroups: (filters) => {
        const doesSearchPhraseMatch = createSearchPhraseChecker(
            filters[SEARCH_PARAM.PICKER.FILTER.SEARCH]
        );

        const filteredOptions = options.filter((option) => doesSearchPhraseMatch(option.label));

        return (
            grouper?.(filteredOptions) ?? [
                {
                    label: '',
                    options: filteredOptions
                }
            ]
        );
    }
});

const createGroupHeaderPickerConfig = (options: Options, grouping?: string): PickerConfig => {
    const detailRegex =
        {
            '*Centrum Językowe*':
                /^(?:CJ-){1,2}-?(?<mode>[SN])(?<stage>.)-{1,2}(?<year>\d)\/(?<semester>\d)-?(?<language>[A-Z]{3})\.(?<languageLevel>[A-Z]\d\+?)/,
            '*PONE Nowy Targ*': /^PPUZ-[A-Z]{3}(?<mode>[SN])(?<stage>.)-(?<year>\d)(?<semester>\d)/
        }[grouping ?? ''] ?? /^[A-Z]{4}(?<mode>[SN])(?<stage>.)-(?<year>\d)(?<semester>\d)/;

    const detailedOptions = options.map((option) => {
        const details = option.label.match(detailRegex)?.groups;
        const year = superParseInt(details?.year);
        const semester = superParseInt(details?.semester);

        return {
            ...option,
            details: {
                mode: (
                    {
                        S: 'full-time',
                        N: 'part-time'
                    } as const
                )[details?.mode ?? ''],
                stage: (
                    {
                        '1': 'bachelor',
                        '2': 'master',
                        M: 'oneTier'
                    } as const
                )[details?.stage?.trim() ?? ''],
                // semester 10 has 0 cut off from the end
                semester: year === 5 && semester === 1 ? 10 : semester,
                language: details?.language?.trim(),
                languageLevel: details?.languageLevel?.trim()
            }
        };
    });

    const uniqueModes = new Set<keyof typeof STUDY_MODE>();
    const uniqueStages = new Set<keyof typeof STUDY_STAGE>();
    const uniqueLanguages = new Set<string>();
    const uniqueLanguageLevels = new Set<string>();
    let highestSemester = 0;

    for (const option of detailedOptions) {
        if (option.details.mode) {
            uniqueModes.add(option.details.mode);
        }

        if (option.details.stage) {
            uniqueStages.add(option.details.stage);
        }

        if (option.details.semester) {
            highestSemester = Math.max(highestSemester, option.details.semester);
        }

        if (option.details.language) {
            uniqueLanguages.add(option.details.language);
        }

        if (option.details.languageLevel) {
            uniqueLanguageLevels.add(option.details.languageLevel);
        }
    }

    const filtersConfig: FiltersConfig = [];

    if (options.length > 0) {
        filtersConfig.push({
            name: SEARCH_PARAM.PICKER.FILTER.SEARCH,
            type: 'search',
            placeholder: m.searchExamplePlaceholder({
                value: options[Math.floor(options.length / 2)]!.label
            })
        });
    }

    const stageModeFilterOptions = [...uniqueStages]
        .sort((a, b) => (STUDY_STAGE[a].order > STUDY_STAGE[b].order ? 1 : -1))
        .flatMap((studyStage) =>
            [...uniqueModes]
                .sort((a, b) => (STUDY_MODE[a].order > STUDY_MODE[b].order ? 1 : -1))
                .map((studyMode) => ({
                    label: [STUDY_STAGE[studyStage].label(), STUDY_MODE[studyMode].label()].join(
                        ', '
                    ),
                    value: [studyStage, studyMode].join('_')
                }))
        );

    if (stageModeFilterOptions.length > 0) {
        filtersConfig.push({
            name: SEARCH_PARAM.PICKER.FILTER.STAGE_MODE,
            type: 'picklist',
            placeholder: m.studyStageModeSelectPlaceholder(),
            options: stageModeFilterOptions
        });
    }

    const yearSemesterFilterOptions = [...Array(highestSemester).keys()]
        .map((semester) => semester + 1)
        .map((semester) => {
            return {
                label: m.yearSemesterOption({
                    year: Math.ceil(semester / 2),
                    semester: semester
                }),
                value: semester.toString()
            };
        });

    if (yearSemesterFilterOptions.length > 0) {
        filtersConfig.push({
            name: SEARCH_PARAM.PICKER.FILTER.YEAR_SEMESTER,
            type: 'picklist',
            placeholder: m.yearSemesterSelectPlaceholder(),
            options: yearSemesterFilterOptions
        });
    }

    if (uniqueLanguages.size > 0 && uniqueLanguageLevels.size > 0) {
        filtersConfig.push(
            {
                name: SEARCH_PARAM.PICKER.FILTER.LANGUAGE,
                type: 'picklist',
                placeholder: m.languageSelectPlaceholder(),
                options: [...uniqueLanguages].sort().map((language) => ({
                    value: language
                }))
            },
            {
                name: SEARCH_PARAM.PICKER.FILTER.LANGUAGE_LEVEL,
                type: 'picklist',
                placeholder: m.languageLevelSelectPlaceholder(),
                options: [...uniqueLanguageLevels].sort().map((languageLevel) => ({
                    value: languageLevel
                }))
            }
        );
    }

    const getFilteredOptionGroups: FilteredOptionGroupsProvider = (filters) => {
        const doesSearchPhraseMatch = createSearchPhraseChecker(
            filters[SEARCH_PARAM.PICKER.FILTER.SEARCH]
        );
        const [studyStage, studyMode] =
            filters[SEARCH_PARAM.PICKER.FILTER.STAGE_MODE]?.split('_') ?? [];
        const semester = superParseInt(filters[SEARCH_PARAM.PICKER.FILTER.YEAR_SEMESTER]);

        const filteredOptions = detailedOptions.filter(
            (option) =>
                doesSearchPhraseMatch(option.label) &&
                !areValuesTruthyAndUnequal(studyMode, option.details.mode) &&
                !areValuesTruthyAndUnequal(studyStage, option.details.stage) &&
                !areValuesTruthyAndUnequal(semester, option.details.semester) &&
                !areValuesTruthyAndUnequal(
                    filters[SEARCH_PARAM.PICKER.FILTER.LANGUAGE],
                    option.details.language
                ) &&
                !areValuesTruthyAndUnequal(
                    filters[SEARCH_PARAM.PICKER.FILTER.LANGUAGE_LEVEL],
                    option.details.languageLevel
                )
        );

        // todo: refactor this shit
        const ungroupedOptions: typeof filteredOptions = [];
        const optionGroups: OptionGroups = [
            ...filteredOptions
                .reduce((stageModeToOptions, option) => {
                    if (option.details.mode && option.details.stage) {
                        const stageModeKey = option.details.stage + option.details.mode;
                        if (stageModeToOptions.has(stageModeKey)) {
                            stageModeToOptions.get(stageModeKey)!.push(option);
                        } else {
                            stageModeToOptions.set(stageModeKey, [option]);
                        }
                    } else {
                        ungroupedOptions.push(option);
                    }

                    return stageModeToOptions;
                }, new Map<string, typeof filteredOptions>())
                .values()
        ]
            .sort((a, b) => {
                const studyModeOrderA = STUDY_MODE[a[0]!.details.mode!].order;
                const studyModeOrderB = STUDY_MODE[b[0]!.details.mode!].order;
                if (studyModeOrderA > studyModeOrderB) {
                    return 1;
                }
                if (studyModeOrderA < studyModeOrderB) {
                    return -1;
                }

                const studyStageOrderA = STUDY_STAGE[a[0]!.details.stage!].order;
                const studyStageOrderB = STUDY_STAGE[b[0]!.details.stage!].order;
                if (studyStageOrderA > studyStageOrderB) {
                    return 1;
                }
                if (studyStageOrderA < studyStageOrderB) {
                    return -1;
                }

                return 0;
            })
            .map((stageModeOptions) => ({
                label: [
                    STUDY_STAGE[stageModeOptions[0]!.details.stage!].label(),
                    STUDY_MODE[stageModeOptions[0]!.details.mode!].label()
                ].join(', '),
                groups: [
                    ...stageModeOptions
                        .reduce((semesterToOptions, modeStageOption) => {
                            if (modeStageOption.details.semester) {
                                if (semesterToOptions.has(modeStageOption.details.semester)) {
                                    semesterToOptions
                                        .get(modeStageOption.details.semester)!
                                        .push(modeStageOption);
                                } else {
                                    semesterToOptions.set(modeStageOption.details.semester, [
                                        modeStageOption
                                    ]);
                                }
                            } else {
                                ungroupedOptions.push(modeStageOption);
                            }

                            return semesterToOptions;
                        }, new Map<number, typeof stageModeOptions>())
                        .values()
                ]
                    .sort((a, b) => {
                        if (a[0]!.details.semester! > b[0]!.details.semester!) {
                            return 1;
                        }

                        if (a[0]!.details.semester! < b[0]!.details.semester!) {
                            return -1;
                        }

                        return 0;
                    })
                    .map((semesterOptions) => {
                        const semesterGroupLabel = m.yearSemesterOption({
                            year: Math.ceil(semesterOptions[0]!.details.semester! / 2),
                            semester: semesterOptions[0]!.details.semester!
                        });

                        if (uniqueLanguages.size === 0 && uniqueLanguageLevels.size === 0) {
                            return {
                                label: semesterGroupLabel,
                                options: semesterOptions
                            };
                        }

                        return {
                            label: semesterGroupLabel,
                            groups: [
                                ...semesterOptions
                                    .reduce((languageAndLevelToOptions, semesterOption) => {
                                        if (
                                            semesterOption.details.language &&
                                            semesterOption.details.languageLevel
                                        ) {
                                            const languageAndLevelKey =
                                                semesterOption.details.language +
                                                semesterOption.details.languageLevel;
                                            if (
                                                languageAndLevelToOptions.has(languageAndLevelKey)
                                            ) {
                                                languageAndLevelToOptions
                                                    .get(languageAndLevelKey)!
                                                    .push(semesterOption);
                                            } else {
                                                languageAndLevelToOptions.set(languageAndLevelKey, [
                                                    semesterOption
                                                ]);
                                            }
                                        } else {
                                            ungroupedOptions.push(semesterOption);
                                        }
                                        return languageAndLevelToOptions;
                                    }, new Map<string, typeof semesterOptions>())
                                    .values()
                            ]
                                .sort((a, b) => {
                                    if (a[0]!.details.language! > b[0]!.details.language!) {
                                        return 1;
                                    }
                                    if (a[0]!.details.language! < b[0]!.details.language!) {
                                        return -1;
                                    }

                                    if (
                                        a[0]!.details.languageLevel! > b[0]!.details.languageLevel!
                                    ) {
                                        return 1;
                                    }
                                    if (
                                        a[0]!.details.languageLevel! < b[0]!.details.languageLevel!
                                    ) {
                                        return -1;
                                    }

                                    return 0;
                                })
                                .map((languageAndLevelOptions) => ({
                                    label: [
                                        languageAndLevelOptions[0]!.details.language,
                                        languageAndLevelOptions[0]!.details.languageLevel
                                    ].join(' - '),
                                    options: languageAndLevelOptions
                                }))
                        };
                    })
            }));

        if (ungroupedOptions.length > 0) {
            optionGroups.push({
                label: m.pickerGroupOther(),
                options: ungroupedOptions
            });
        }

        return optionGroups;
    };

    return { filtersConfig, getFilteredOptionGroups };
};

export const getPickerConfig = ({
    options,
    scheduleType,
    isHeader,
    grouping
}: {
    options: Options;
    scheduleType: ScheduleType;
    isHeader: boolean;
    grouping?: string;
}): PickerConfig => {
    if (scheduleType === 'group') {
        if (isHeader) {
            return createGroupHeaderPickerConfig(options, grouping);
        }

        return createSearchOnlyPickerConfig({
            options,
            grouper: groupOptionsByFirstLetter,
            placeholder:
                options.length > 0
                    ? m.searchExamplePlaceholder({
                          value: options[Math.floor(options.length / 2)]!.label
                      })
                    : ''
        });
    }

    if (scheduleType === 'lecturer') {
        if (isHeader) {
            return createSearchOnlyPickerConfig({
                options,
                grouper: groupOptionsByFirstLetter,
                placeholder: m.searchExamplePlaceholder({
                    value: 'Jan Kowalski, prof. UEK dr hab.'
                })
            });
        }
    }

    return createSearchOnlyPickerConfig({
        options,
        placeholder:
            options.length > 0
                ? m.searchExamplePlaceholder({
                      value: options[Math.floor(options.length / 2)]!.label
                  })
                : ''
    });
};
