/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "void": "#050505",
            },
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'],
                orbitron: ['"Orbitron"', 'sans-serif'],
                petit: ['"Petit Formal Script"', 'cursive'],
                mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
            }
        },
    },
    plugins: [],
}
