import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import About from './pages/About';


function App() {
    return (
        <AuthProvider>
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/about" element={<About />} />

                    {/* Add Admin Route Later */}
                </Routes>
            </HashRouter>
        </AuthProvider>
    );
}

export default App;
