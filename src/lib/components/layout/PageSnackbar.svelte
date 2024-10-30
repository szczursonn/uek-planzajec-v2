<script lang="ts">
    import { onMount } from 'svelte';
    import * as m from '$lib/paraglide/messages';
    import { getGlobalContext } from '$lib/stores/globalContext';
    import Icon from '$lib/components/Icon.svelte';

    const TRANSITION_DURATION = 150;

    const { snackbarStore } = getGlobalContext();

    let message = $state('');
    let isVisible = $state(false);

    onMount(() => {
        let transitionTimeout: ReturnType<typeof setTimeout> | null = null;

        const cleanupTimeout = () => {
            if (transitionTimeout) {
                clearTimeout(transitionTimeout);
                transitionTimeout = null;
            }
        };

        const unsubscribeSnackbarStore = snackbarStore.subscribe((store) => {
            cleanupTimeout();

            if (store) {
                message = store.message;
                if (!isVisible) {
                    transitionTimeout = setTimeout(() => {
                        isVisible = true;
                    }, 0);
                }
            } else {
                isVisible = false;
                transitionTimeout = setTimeout(() => {
                    message = '';
                }, TRANSITION_DURATION);
            }
        });

        return () => {
            unsubscribeSnackbarStore();
            cleanupTimeout();
        };
    });
</script>

{#if message}
    <div
        class={`fixed bottom-5 z-50 w-[90%] justify-between gap-2 rounded-xl border-2 border-green-800 bg-green-700 p-4 shadow-2xl transition-opacity sm:bottom-20 sm:w-[75%] md:w-1/2 xl:w-1/3 3xl:w-1/4 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        role="alert"
        aria-hidden={isVisible ? 'false' : 'true'}
    >
        <div class="absolute bottom-0 left-6 flex h-full items-center justify-center">
            <Icon class="h-6 w-6" iconName="check" />
        </div>
        <div class="mx-12 text-sm">{message}</div>
        <div class="absolute bottom-0 right-6 flex h-full items-center justify-center">
            <button
                class="rounded-full bg-transparent p-2 transition-colors hover:bg-green-800"
                type="button"
                title={m.snackbarClose()}
                onclick={() => {
                    snackbarStore.hide();
                }}
            >
                <Icon class="h-3.5 w-3.5" iconName="cross" />
            </button>
        </div>
    </div>
{/if}
