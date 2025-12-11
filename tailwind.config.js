/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Warmth Palette
                paper: '#F9F7F2', // Main background (warm cream)
                card: '#FFFFFF',  // Component background
                ink: '#2C2B2B',   // Primary text
                pencil: '#666666', // Secondary text

                // Accents
                warm: {
                    50: '#FFF8F3',
                    100: '#FEF0E6',
                    200: '#FDDCCB',
                    300: '#FBC0A6',
                    400: '#F89F7D',
                    500: '#E68A65', // Primary Brand Color (Clay/Terracotta)
                    600: '#D16D4D',
                    700: '#AC4E36',
                    800: '#8A3C2B',
                    900: '#713226',
                },
                sage: {
                    50: '#F4F7F4',
                    100: '#E3EBE3',
                    200: '#C5D6C5',
                    300: '#A3BEA3',
                    400: '#84A584', // Healing Green
                    500: '#698B69',
                    600: '#526F52',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['"Noto Serif SC"', 'Merriweather', 'serif'], // Literary feel
                hand: ['"Ma Shan Zheng"', 'cursive'], // For signatures or special feel
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'breathe': 'breathe 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                breathe: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.02)' },
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
