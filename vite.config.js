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
                id: '/',
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
                ],
                screenshots: [
                    {
                        src: 'screenshot-mobile-v2.png',
                        sizes: '1080x1920',
                        type: 'image/png',
                        form_factor: 'narrow',
                        label: 'Mobile Home Screen'
                    },
                    {
                        src: 'screenshot-desktop-v2.png',
                        sizes: '1920x1080',
                        type: 'image/png',
                        form_factor: 'wide',
                        label: 'Desktop Chat View'
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
