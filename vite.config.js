import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                name: 'Strangers - 温暖的陌生人',
                short_name: 'Strangers',
                description: '一个温暖的陌生人聊天应用',
                theme_color: '#1a1a1a',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    base: './', // Use relative paths for assets to work on GH Pages subpaths
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8787',
                changeOrigin: true,
            }
        }
    }
})
