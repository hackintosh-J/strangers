import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage or validate token with API
        const stored = localStorage.getItem('strangers_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                localStorage.removeItem('strangers_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // Call API
        // const res = await fetch('/api/auth/login', ...);
        // For now mock
        const mockUser = { id: 1, username, role: 'admin' };
        setUser(mockUser);
        localStorage.setItem('strangers_user', JSON.stringify(mockUser));
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('strangers_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
