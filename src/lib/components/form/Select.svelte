<script lang="ts" module>
    type Variant = 'underline' | 'outline';

    const VARIANT_TO_SELECT_CLASS = {
        underline:
            'w-full cursor-pointer border-b-2 border-b-secondary bg-transparent px-0 py-2 text-sm transition-colors hover:border-primary focus:border-primary focus:outline-none sm:py-2.5',
        outline:
            'focus:border-accent-default w-full cursor-pointer rounded-lg border border-tertiary bg-primary p-2 text-secondary transition-colors focus-visible:outline-none has-[option:checked:not([value=""])]:text-primary'
    } as const satisfies Record<Variant, string>;
</script>

<script lang="ts">
    let {
        name,
        title,
        variant = 'outline',
        placeholder,
        options = [],
        value = $bindable(),
        disabled = false,
        class: className,
        onchange
    }: {
        name?: string;
        title?: string;
        variant?: Variant;
        placeholder?: string;
        options?: {
            value: string;
            label?: string;
        }[];
        value?: string;
        disabled?: boolean;
        class?: string;
        onchange?: (event: Event & { currentTarget: EventTarget & HTMLSelectElement }) => void;
    } = $props();
</script>

<select
    class={[VARIANT_TO_SELECT_CLASS[variant], className].filter(Boolean).join(' ')}
    {name}
    {title}
    {disabled}
    bind:value
    {onchange}
>
    {#if placeholder}
        <option class="text-secondary" value="" label={placeholder}></option>
    {/if}
    {#each options as option}
        <option
            class="bg-primary text-primary"
            value={option.value}
            label={option.label ?? option.value}
            selected={option.value === value}
        ></option>
    {/each}
</select>
