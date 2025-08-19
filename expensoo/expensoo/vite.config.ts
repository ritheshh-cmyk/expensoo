import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    optimizeDeps: {
        include: [
            '@hookform/resolvers/yup',
            'react-hook-form',
            'yup',
            '@tanstack/react-table',
            'lucide-react',
            'clsx',
            'tailwind-merge',
        ],
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom', 'react-router-dom'],
                    form: ['react-hook-form', '@hookform/resolvers/yup', 'yup'],
                    ui: [
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-select',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-toast',
                        'lucide-react',
                    ],
                },
            },
        },
    },
});