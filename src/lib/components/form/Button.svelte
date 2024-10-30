<script lang="ts" module>
    import type { IconName } from '$lib/components/Icon.svelte';

    type Variant = 'primary' | 'underline' | 'outline' | 'outline-secondary';
    type LinkOnlyProps = { href: string; formaction?: undefined; nofollow?: boolean };
    type FormOnlyProps = { href?: undefined; formaction?: string; nofollow?: undefined };
    type GenericProps = {
        class?: string;
        label: string;
        iconName?: IconName;
        variant?: Variant;
    };

    const BASE_CLASS =
        'flex items-center text-center justify-center gap-2 w-full max-w-fit px-4 py-2 transition-colors';
    const VARIANT_TO_CLASS = {
        primary:
            'bg-accent-default hover:bg-accent-highlight border rounded-lg border-accent-default',
        underline:
            'bg-transparent border-b-2 border-b-secondary hover:border-primary focus:border-primary transition-colors',
        outline:
            'text-primary bg-primary border rounded-lg border-primary hover:border-accent-default focus:border-accent-default',
        'outline-secondary': 'bg-secondary hover:bg-tertiary rounded-lg border border-secondary'
    } satisfies Record<Variant, string>;
</script>

<script lang="ts">
    import Icon from '$lib/components/Icon.svelte';

    const {
        class: classNameProp,
        variant = 'primary',
        label,
        href,
        nofollow = false,
        formaction,
        iconName
    }: GenericProps & (LinkOnlyProps | FormOnlyProps) = $props();

    const className = $derived(
        [BASE_CLASS, VARIANT_TO_CLASS[variant], classNameProp].filter(Boolean).join(' ')
    );
</script>

{#snippet buttonInternals()}
    {#if iconName}
        <Icon class="h-4 w-4" {iconName} ariaHidden />
    {/if}
    <span>{label}</span>
{/snippet}

{#if href}
    <a class={className} {href} title={label} rel={nofollow ? 'nofollow' : undefined}>
        {@render buttonInternals()}
    </a>
{:else}
    <button class={className} type="submit" {formaction} title={label}>
        {@render buttonInternals()}
    </button>
{/if}
