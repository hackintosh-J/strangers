import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home, Compass, BookOpen, MessageSquare, Menu, X, LogIn, CircleUser } from 'lucide-react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [channels, setChannels] = useState([]);

    // Mock channels hardcoded for speed, or fetch from API
    // Let's fetch from API eventually, but hardcode for instant render first
    const DEFAULT_CHANNELS = [
        { slug: 'help', name: '解忧杂货店', icon: '📪' },
        { slug: 'hollow', name: '树洞', icon: '🌲' },
        { slug: 'stories', name: '故事集', icon: '📖' },
    ];

    const toggle = () => setIsOpen(!isOpen);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const NavItem = ({ to, icon, label, exact = false }) => {
        const active = exact ? location.pathname === to : location.pathname.startsWith(to);
        return (
            <Link
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active
                        ? 'bg-warm-100 text-warm-800'
                        : 'text-pencil hover:bg-warm-50 hover:text-ink'
                    }`}
            >
                {icon}
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Trigger */}
            <button onClick={toggle} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-paper/80 backdrop-blur rounded-full border border-warm-200 shadow-sm text-ink">
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" onClick={toggle} />
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed top-0 left-0 bottom-0 w-64 bg-paper border-r border-warm-100 z-40 transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:block
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full p-6">
                    {/* Brand */}
                    <div className="mb-10 pl-2">
                        <Link to="/" className="text-2xl font-hand text-warm-600">温暖的陌生人</Link>
                    </div>

                    {/* Nav */}
                    <nav className="space-y-2 flex-1">
                        <NavItem to="/" icon={<Home size={20} />} label="首页" exact />

                        <div className="pt-6 pb-2 pl-4 text-xs font-bold text-warm-300 uppercase tracking-wider">板块</div>
                        {DEFAULT_CHANNELS.map(ch => (
                            <NavItem
                                key={ch.slug}
                                to={`/channel/${ch.slug}`}
                                icon={<span className="text-lg leading-none">{ch.icon}</span>}
                                label={ch.name}
                            />
                        ))}

                        <div className="pt-6 pb-2 pl-4 text-xs font-bold text-warm-300 uppercase tracking-wider">关于</div>
                        <NavItem to="/about" icon={<Compass size={20} />} label="初衷" />
                    </nav>

                    {/* User Footer */}
                    <div className="pt-6 border-t border-warm-100">
                        {user ? (
                            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-warm-50 transition-colors cursor-pointer group relative">
                                <div className="w-10 h-10 rounded-full bg-warm-200 flex items-center justify-center text-warm-700 font-bold">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-ink truncate">{user.username}</p>
                                    <p className="text-xs text-warm-400">已登录</p>
                                </div>

                                {/* Mini Popover for Logout */}
                                <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-lg border border-warm-100 p-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all">
                                    <Link to="/profile" className="block w-full text-left px-3 py-2 text-sm text-pencil hover:bg-warm-50 rounded-lg">个人资料</Link>
                                    <button onClick={logout} className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-50 rounded-lg">退出登录</button>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="flex items-center justify-center gap-2 w-full py-3 bg-warm-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-warm-700 transition-all">
                                <LogIn size={18} />
                                <span>登录 / 注册</span>
                            </Link>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
