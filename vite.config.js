import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        allowedHosts: ['bloom-86z2.onrender.com'],
        proxy: {
            // This tells Vite to forward any request that starts with /api
            // to your backend server running on http://localhost:3000
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true, // Recommended for avoiding CORS issues
                secure: false,      // Allows proxying to HTTP servers
            },
        },
    },
});