<script lang="ts">
    import * as m from '$lib/paraglide/messages';
    import uekLogo from '$lib/assets/uekLogo.svg';
</script>

<header class="mb-2 mt-2 sm:mb-4">
    <a
        class="flex items-center gap-4 transition-opacity hover:opacity-80"
        href="/"
        title={m.appTitle()}
    >
        <img class="w-24 sm:w-32" src={uekLogo} alt="UEK Logo" fetchpriority="high" />
        <span class="text-lg font-bold capitalize sm:text-3xl">{m.appTitle()}</span>
    </a>
</header>
