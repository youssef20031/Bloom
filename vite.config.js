import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // This tells Vite to forward any request that starts with /api
            // to your backend server running on http://localhost:3001
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true, // Recommended for avoiding CORS issues
                secure: false,      // Allows proxying to HTTP servers
            },
        },
    },
});