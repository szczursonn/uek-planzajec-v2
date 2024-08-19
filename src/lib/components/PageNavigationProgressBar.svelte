<script lang="ts">
    import { onMount } from 'svelte';
    import { navigating } from '$app/stores';

    let progress = $state(0);

    onMount(() => {
        let updateProgressInterval: ReturnType<typeof setInterval> | undefined;
        let resetProgressTimeout: ReturnType<typeof setTimeout> | undefined;

        const unsubscribe = navigating.subscribe((nav) => {
            if (nav) {
                clearTimeout(resetProgressTimeout);

                progress = 15;
                updateProgressInterval = setInterval(() => {
                    progress += 0.25 * (30 - progress);
                }, 100);
            } else {
                progress = 100;
                clearInterval(updateProgressInterval);
                resetProgressTimeout = setTimeout(() => {
                    progress = 0;
                }, 500);
            }
        });

        return () => unsubscribe();
    });
</script>

<div
    class={`${$navigating ? 'opacity-100' : 'opacity-0'} pointer-events-none fixed top-0 h-1 w-full bg-secondary bg-transparent transition-opacity duration-300`}
    role="progressbar"
    aria-hidden={!$navigating}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={progress}
>
    <div
        class="h-1 rounded-r-full bg-accent transition-width duration-500"
        style={`width: ${progress}%`}
    ></div>
</div>
