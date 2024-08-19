import { SCHEDULE_VIEW_TO_LABEL } from '$lib/consts';

export const match = (scheduleView) => scheduleView in SCHEDULE_VIEW_TO_LABEL;
