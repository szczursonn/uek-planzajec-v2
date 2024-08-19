import { SCHEDULE_TYPE_TO_LABELS } from '$lib/consts';

export const match = (scheduleType) => scheduleType in SCHEDULE_TYPE_TO_LABELS;
