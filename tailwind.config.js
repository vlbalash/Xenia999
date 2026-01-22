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
                mono: ['"Inter"', 'monospace'], // Simplify for now, prompt mentioned Inter
            }
        },
    },
    plugins: [],
}
