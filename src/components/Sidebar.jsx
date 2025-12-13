import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home, Compass, MessageSquare, Menu, User, LogIn, Ship, Sparkles, PenTool } from 'lucide-react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Notifications
    const API_URL = import.meta.env.VITE_API_URL || '';
    // Poll for notifications
    const { data: notifs } = useSWR(
        user ? `${API_URL}/api/notifications/status` : null,
        (url) => fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
        { refreshInterval: 15000 }
    );

    // Check localStorage for last viewed follower
    const [hasNewFollower, setHasNewFollower] = useState(false);
    useEffect(() => {
        if (notifs?.latest_follower_at) {
            const lastSeen = parseInt(localStorage.getItem('last_seen_follower_at') || '0');
            if (notifs.latest_follower_at > lastSeen) {
                setHasNewFollower(true);
            }
        }
    }, [notifs]);

    const NAV_ITEMS = [
        { to: '/', icon: <Home size={24} />, label: '首页' },
        {
            to: '/friends',
            icon: <User size={24} />,
            label: '好友',
            badge: notifs?.unread_dm_count > 0 // Show red dot if unread messages
        },
        { to: '/compose', icon: <PenTool size={24} />, label: '发帖', highlight: true }, // Absolute Center
        { to: '/echo', icon: <Sparkles size={24} />, label: 'Echo' },
        {
            to: user ? '/profile' : '/login',
            icon: user ? <div className="w-5 h-5 rounded-full bg-oat-200 border-2 border-current" /> : <LogIn size={24} />,
            label: user ? '我的' : '入驻',
            badge: hasNewFollower
        },
    ];

    const NavItem = ({ to, icon, label, highlight, exact = false, badge }) => {
        const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

        // Highlight style (Center Button)
        if (highlight) {
            return (
                <Link to={to} className="flex items-center justify-center -mt-8 md:mt-0 md:px-6 md:py-3.5">
                    <div className="w-14 h-14 md:w-full md:h-12 bg-haze-600 rounded-full md:rounded-xl text-white flex items-center justify-center md:justify-start md:px-4 gap-3 shadow-lg hover:bg-haze-700 hover:scale-105 active:scale-95 transition-all border-4 border-white md:border-0">
                        {icon}
                        <span className="hidden md:block font-bold">发帖</span>
                    </div>
                </Link>
            )
        }

        return (
            <Link
                to={to}
                className={`
          flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 md:px-6 md:py-3.5 rounded-xl transition-all duration-300 relative
          ${isActive
                        ? 'text-haze-600 md:bg-haze-50 font-bold'
                        : 'text-oat-400 hover:text-haze-500 md:hover:bg-oat-50'
                    }
        `}
            >
                <div className="relative">
                    {icon}
                    {isActive && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-haze-500 rounded-full md:hidden" />}
                    {badge && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white md:border-oat-50" />}
                </div>
                {/* Show text on mobile, smaller */}
                <span className="text-[10px] md:text-sm font-medium tracking-wide">{label}</span>
                {badge && <span className="hidden md:block w-2 h-2 bg-red-500 rounded-full" />}
            </Link>
        );
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-oat-50 border-r border-oat-200">
                <div className="p-8 pb-10">
                    <Link to="/" className="block">
                        <h1 className="text-3xl font-hand text-haze-700 select-none">陌生人</h1>
                        <p className="text-xs text-oat-400 mt-1 uppercase tracking-[0.2em]">The Strangers</p>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {NAV_ITEMS.map(item => (
                        <NavItem key={item.to} {...item} exact={item.to === '/'} />
                    ))}
                </nav>

                {user && (
                    <div className="p-6 mx-4 mb-6 rounded-2xl bg-white border border-oat-200 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-oat-100 flex items-center justify-center text-oat-500 font-serif font-bold">
                            {user.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-ink truncate">{user.username}</div>
                            <button onClick={logout} className="text-xs text-rose-400 hover:text-rose-600 transition-colors">退出登录</button>
                        </div>
                    </div>
                )}
            </aside>

            {/* Mobile Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-t border-oat-200 z-50 px-6 pb-2 safe-area-pb shadow-[0_-5px_20px_rgba(0,0,0,0.03)] flex justify-between items-center">
                {NAV_ITEMS.map(item => (
                    <NavItem key={item.to} {...item} exact={item.to === '/'} />
                ))}
            </div>
        </>
    );
}
