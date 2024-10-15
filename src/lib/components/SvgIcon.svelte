<script lang="ts">
    import icons from '$lib/assets/icons.svg';

    const {
        iconName,
        class: className,
        ariaHidden = false
    }: {
        iconName:
            | 'pin'
            | 'chevronDown'
            | 'plus'
            | 'cross'
            | 'search'
            | 'arrowLeft'
            | 'githubLogo'
            | 'alert'
            | 'star'
            | 'starOutline'
            | 'clock'
            | 'person'
            | 'langFlagPL'
            | 'langFlagEN';
        ariaHidden?: boolean;
        class?: string;
    } = $props();

    const svgProps = $derived({
        class: className,
        'aria-hidden': ariaHidden,
        fill: 'currentColor'
    });
</script>

<svg {...svgProps}>
    <use xlink:href={`${icons}#${iconName}`}></use>
</svg>
