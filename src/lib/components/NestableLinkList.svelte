<script lang="ts" context="module">
    export type Options = { label: string; href: string }[];
    export type OptionGroups = ({ label: string } & (
        | {
              groups: OptionGroups;
              options?: never;
          }
        | {
              groups?: never;
              options: Options;
          }
    ))[];

    const NEST_LEVEL_CLASSES = [
        'text-2xl md:text-3xl font-extrabold',
        'text-xl md:text-2xl font-bold',
        'text-lg md:text-xl font-semibold',
        'text-md md:text-lg font-light'
    ];
</script>

<script lang="ts">
    import NestableLinkList from '$lib/components/NestableLinkList.svelte';

    const { optionGroups, nestLevel = 0 }: { optionGroups: OptionGroups; nestLevel?: number } =
        $props();
</script>

<ul>
    {#each optionGroups as optionGroup}
        <li>
            {#if optionGroup.label}
                <span
                    class={NEST_LEVEL_CLASSES[nestLevel] ?? NEST_LEVEL_CLASSES.at(-1)}
                    role="heading"
                    aria-level={nestLevel + 1}
                >
                    {optionGroup.label}
                </span>
            {/if}
            {#if optionGroup.groups}
                <NestableLinkList optionGroups={optionGroup.groups} nestLevel={nestLevel + 1} />
            {:else}
                <ul
                    class="my-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                >
                    {#each optionGroup.options as option}
                        <li>
                            <a
                                class="block h-full border-b-2 border-b-secondary px-2 py-4 text-sm font-semibold transition-colors hover:border-b-accent hover:bg-secondary"
                                title={option.label}
                                href={option.href}
                            >
                                {option.label}
                            </a>
                        </li>
                    {/each}
                </ul>
            {/if}
        </li>
    {/each}
</ul>
