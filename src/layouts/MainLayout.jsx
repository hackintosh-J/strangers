import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Animated Page Wrapper (Only for content)
const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }} // Removed y-axis movement to reduce motion sickness
        className="w-full h-full"
    >
        {children}
    </motion.div>
);

export default function MainLayout() {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Aggressive Preloading for China Latency Optimization
    useEffect(() => {
        if (!user) return;
        const API_URL = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('token'); // or from useAuth if exposed, but useAuth returns token state which might be null initially.
        // Actually useAuth exposes token.
        // Let's us direct fetch or SWR preload.

        const preload = (url) => {
            const fetcher = (u) => fetch(u, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
            // Mutate with undefined to trigger fetch and cache without SWR hook? 
            // Better: use explicit prefetch or SWR preload. 
            // Since we use SWR, simply fetching and putting in cache map is enough if keys match.
            // But we don't have access to global cache here easily without useSWRConfig.
            fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        };

        // Delay slightly to not block main thread
        const id = setTimeout(() => {
            preload(`${API_URL}/api/channels`);
            preload(`${API_URL}/api/messages?sort=hot&limit=5`);
            preload(`${API_URL}/api/friends`);
        }, 2000);

        return () => clearTimeout(id);
    }, [user]);

    return (
        <div className="flex min-h-screen bg-oat-50">
            {/* Sidebar is now PERMANENT here */}
            <Sidebar />

            <main className="flex-1 w-full relative">
                <AnimatePresence mode="popLayout">
                    {/* Key is location.pathname to trigger animation on route change */}
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0 } }} // Instant exit
                        transition={{ duration: 0.2 }}
                        className="w-full h-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
