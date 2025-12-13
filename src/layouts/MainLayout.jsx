import React from 'react';
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

    // If still loading auth, maybe show a spinner or just render nothing?
    // Usually App.jsx handles the big loading screen.
    // Here we just render the structure.

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
