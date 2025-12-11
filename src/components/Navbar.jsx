import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, LogOut, User, Shield } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-sm border-b border-warm-100">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="text-2xl font-hand text-warm-600 hover:text-warm-700 transition-colors">
                    温暖的陌生人
                </Link>
                <Link to="/about" className="hidden sm:block text-warm-400 hover:text-warm-600 font-serif text-sm ml-4">
                    关于·初衷
                </Link>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            {user.role === 'admin' && (
                                <Link to="/admin" className="p-2 hover:bg-warm-100 rounded-full text-warm-600 transition-colors" title="管理面板">
                                    <Shield size={20} />
                                </Link>
                            )}
                            <Link to="/profile" className="flex items-center gap-2 text-sm font-medium text-pencil hover:text-ink transition-colors">
                                <User size={18} />
                                <span className="hidden sm:inline">{user.username}</span>
                            </Link>
                            <button
                                onClick={logout}
                                className="p-2 hover:bg-warm-100 rounded-full transition-colors text-pencil hover:text-warm-700"
                                title="退出"
                            >
                                <LogOut size={20} />
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="flex items-center gap-2 px-5 py-2 bg-warm-500 text-white rounded-full text-sm font-medium hover:bg-warm-600 transition-all shadow-sm hover:shadow-md"
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
