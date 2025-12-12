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
import Drifting from './pages/Drifting';
import Echo from './pages/Echo';
import Compose from './pages/Compose';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import { useAuth } from './hooks/useAuth';

function App() {
    return (
        <AuthProvider>
            <HashRouter>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/channel/:slug" element={<ChannelFeed />} />
                    <Route path="/post/:id" element={<PostDetail />} />
                    <Route path="/drifting" element={<Drifting />} />
                    <Route path="/echo" element={<Echo />} />
                    <Route path="/compose" element={<Compose />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/chat/:id" element={<Chat />} />

                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:id" element={<Profile />} />
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
