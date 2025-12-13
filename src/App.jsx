import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, BrowserRouter, HashRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { useAuth } from './hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/Admin'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const ChannelFeed = lazy(() => import('./pages/ChannelFeed'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Drifting = lazy(() => import('./pages/Drifting'));
const Echo = lazy(() => import('./pages/Echo'));
const Compose = lazy(() => import('./pages/Compose'));
const Friends = lazy(() => import('./pages/Friends'));
const Chat = lazy(() => import('./pages/Chat'));
const Welcome = lazy(() => import('./pages/Welcome'));

function Index() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/home');
        }
    }, [user, loading, navigate]);

    if (loading) return null; // Or a spinner
    return user ? null : <Suspense fallback={<LoadingScreen />}><Welcome /></Suspense>;
}

// Global Loading Screen
const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-oat-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-haze-200 border-t-haze-500 rounded-full animate-spin"></div>
            <p className="text-haze-600 font-serif animate-pulse">Loading Strangers...</p>
        </div>
    </div>
);

function App() {
    // Hybrid Router: Use HashRouter for GitHub Pages (to handle subpaths/404s), BrowserRouter for custom domain (clean URLs)
    const isGitHubPages = window.location.hostname.includes('github.io');
    const Router = isGitHubPages ? HashRouter : BrowserRouter;

    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/about" element={<About />} />

                        {/* Authenticated Routes with Persistent Layout */}
                        <Route element={<MainLayout />}>
                            <Route path="/home" element={<Dashboard />} />
                            <Route path="/channel/:slug" element={<ChannelFeed />} />
                            <Route path="/post/:id" element={<PostDetail />} />
                            <Route path="/drifting" element={<Drifting />} />
                            <Route path="/echo" element={<Echo />} />
                            <Route path="/compose" element={<Compose />} />
                            <Route path="/friends" element={<Friends />} />
                            <Route path="/chat/:id" element={<Chat />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/profile/:id" element={<Profile />} />
                        </Route>
                    </Routes>
                </Suspense>
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
