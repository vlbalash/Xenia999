import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/',
    server: {
        host: true,
        port: 3000,
    },
    // base: '/Xenia999/',  // enable only for GitHub Pages deploy
});
