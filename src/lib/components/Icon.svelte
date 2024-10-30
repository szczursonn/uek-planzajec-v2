<script lang="ts" module>
    export type IconName =
        | 'pin'
        | 'chevronDown'
        | 'plus'
        | 'cross'
        | 'search'
        | 'arrowLeft'
        | 'githubLogo'
        | 'alert'
        | 'bookmark'
        | 'bookmarkOutline'
        | 'clock'
        | 'person'
        | 'check'
        | 'langFlagPL'
        | 'langFlagEN';
</script>

<script lang="ts">
    import icons from '$lib/assets/icons.svg';

    const {
        iconName,
        class: className,
        ariaHidden = false
    }: {
        iconName: IconName;
        ariaHidden?: boolean;
        class?: string;
    } = $props();
</script>

<svg class={className} aria-hidden={ariaHidden} fill="currentColor">
    <use xlink:href={`${icons}#${iconName}`}></use>
</svg>
