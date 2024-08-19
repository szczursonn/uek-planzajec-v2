import { favoriteScheduleArraySchema } from '$lib/server/schemaValidators';
import { COOKIE } from '$lib/consts';

export const load = async (ctx) => {
    return {
        now: new Date().getTime(),
        favoriteSchedules: favoriteScheduleArraySchema.parse(
            JSON.parse(ctx.cookies.get(COOKIE.FAVORITES) ?? '[]')
        )
    };
};
