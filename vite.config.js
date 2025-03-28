import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react({
            // Only apply React plugin to files that need it
            include: ['**/*.jsx']
        })
    ],
    build: {
        rollupOptions: {
            input: {
                content: resolve(__dirname, 'content-script.jsx'),
                offscreen: resolve(__dirname, 'offscreen.js'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'styles.css') return 'styles.css';
                    return '[name].[ext]';
                },
                dir: 'dist',
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
}); 