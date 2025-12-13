import React, { useEffect } from 'react';
import { Routes, Route, BrowserRouter, HashRouter, useLocation } from 'react-router-dom';
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
import Welcome from './pages/Welcome';
import { useNavigate } from 'react-router-dom';

function Index() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/home');
        }
    }, [user, loading, navigate]);

    if (loading) return null; // Or a spinner
    return user ? null : <Welcome />;
}

function App() {
    // Hybrid Router: Use HashRouter for GitHub Pages (to handle subpaths/404s), BrowserRouter for custom domain (clean URLs)
    const isGitHubPages = window.location.hostname.includes('github.io');
    const Router = isGitHubPages ? HashRouter : BrowserRouter;

    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/home" element={<Dashboard />} />

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
            </Router>
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
