import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}', './src/routes/**/+error.svelte'],
    theme: {
        extend: {
            transitionProperty: {
                width: 'width'
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif']
            },
            textColor: {
                primary: colors.zinc[200],
                secondary: colors.zinc[400],
                tertiary: colors.zinc[600],
                error: colors.red[300],
                warn: colors.yellow[300],
                accent: colors.blue[400],
                favorite: {
                    default: colors.yellow[400],
                    hover: colors.yellow[300]
                }
            },
            backgroundColor: {
                primary: colors.zinc[950],
                secondary: colors.zinc[800],
                tertiary: colors.zinc[600],
                error: colors.red[900],
                warn: colors.yellow[800],
                accent: colors.blue[500]
            },
            borderColor: {
                primary: colors.zinc[100],
                secondary: colors.zinc[500],
                tiertiary: colors.zinc[700],
                accent: colors.blue[500]
            },
            boxShadowColor: {
                accent: colors.blue[500]
            },
            fontSize: {
                xxs: ['0.5rem', '0.75rem']
            }
        }
    },
    plugins: []
} as Config;
