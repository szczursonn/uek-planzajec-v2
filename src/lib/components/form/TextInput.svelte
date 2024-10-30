<script lang="ts">
    import Icon from '$lib/components/Icon.svelte';

    let {
        name,
        value = $bindable(),
        placeholder,
        autocomplete = 'off',
        type = 'text',
        onchange
    }: {
        name?: string;
        value?: string;
        placeholder?: string;
        autocomplete?: HTMLInputElement['autocomplete'];
        type?: 'text' | 'search';
        onchange?: (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => void;
    } = $props();
</script>

<div class="relative basis-full">
    {#if type === 'search'}
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon class="h-4 w-4 text-secondary" iconName="search" />
        </div>
    {/if}
    <input
        {name}
        {type}
        {placeholder}
        {autocomplete}
        bind:value
        {onchange}
        class={`border-tertiary block w-full rounded-lg border bg-primary p-2 text-sm text-primary transition-colors placeholder:text-secondary focus:border-accent-default focus-visible:outline-none${type === 'search' ? ' pl-10' : ''}`}
    />
</div>
