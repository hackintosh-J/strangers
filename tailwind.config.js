/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Morandi Palette
                // Oat (Base/Background) - Replacing 'paper'
                oat: {
                    50: '#F9F8F6',  // Main background
                    100: '#F2F0EB', // Card background / borders
                    200: '#E6E2D8', // Separators
                    300: '#D5CEC0', // Disabled text
                    400: '#BDB5A3', // Secondary text
                    500: '#A49B86', // Primary text weak
                    600: '#8C836E', // Primary text strong
                    700: '#736B58',
                    800: '#5C5546',
                    900: '#464035',
                },
                // Haze (Interactive/Buttons) - Replacing 'warm'
                haze: {
                    50: '#F0F4F8',
                    100: '#DDE6ED',
                    200: '#C2D1DE',
                    300: '#9FB6CC',
                    400: '#7D9AB8', // Soft Button
                    500: '#6082A3', // Primary Button
                    600: '#4A6987', // Hover
                    700: '#3A526B',
                    800: '#2C3E52',
                    900: '#1F2C3B',
                },
                // Rose (Accents/Errors)
                rose: {
                    50: '#FDF2F4',
                    100: '#FBE6EA',
                    200: '#F6CED6',
                    300: '#EEA9B8',
                    400: '#E47D95',
                    500: '#D65070', // Hearts, Errors
                    600: '#B83A58',
                    700: '#992B45',
                    800: '#7D2237',
                    900: '#641B2C',
                },
                // Ink (Typography)
                ink: {
                    DEFAULT: '#2C2C2C', // Soft Black for headings
                    light: '#5A5A5A',   // For paragraphs
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Noto Serif SC', 'Georgia', 'serif'],
                hand: ['Ma Shan Zheng', 'cursive'],
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'float': '0 10px 30px -5px rgba(96, 130, 163, 0.15)', // Blue-ish shadow
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
