import { register } from '$lib/prometheus';

export const GET = async () => {
    return new Response(await register.metrics(), {
        headers: {
            'Content-Type': register.contentType
        }
    });
};
