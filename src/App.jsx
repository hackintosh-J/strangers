import React, { useEffect } from 'react';
import { Routes, Route, HashRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import About from './pages/About';
import ChannelFeed from './pages/ChannelFeed';
import PostDetail from './pages/PostDetail';

function App() {
    return (
        <AuthProvider>
            <HashRouter>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/channel/:slug" element={<ChannelFeed />} />
                    <Route path="/post/:id" element={<PostDetail />} />

                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/about" element={<About />} />
                </Routes>
            </HashRouter>
        </AuthProvider>
    );
}

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

export default App;
