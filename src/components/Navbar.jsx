import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, LogOut, User, Shield } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Strangers
                </Link>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            {user.role === 'admin' && (
                                <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full text-indigo-600" title="管理面板">
                                    <Shield size={20} />
                                </Link>
                            )}
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User size={18} />
                                <span>{user.username}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                                title="退出"
                            >
                                <LogOut size={20} />
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            <LogIn size={16} />
                            登录
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
