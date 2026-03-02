/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neutral: {
                    850: '#1f1f1f',
                },
                "void": "#050505",
            },
            fontFamily: {
                mono: ['"Inter"', 'monospace'],
            },
            animation: {
                'blob': 'blob 10s infinite',
                'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                'pulse-slow': {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '0.8' },
                }
            }
        },
    },
    plugins: [],
}
