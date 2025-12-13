
import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

import { useAuth } from '../hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Calendar, MessageSquare, Users, Heart, Compass } from 'lucide-react';

export default function Profile() {
    const { user: currentUser, token, logout } = useAuth();
    const { id } = useParams(); // If id exists, viewing other. Else viewing self.
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || '';

    // Determine target ID
    const targetId = id || currentUser?.id;
    const isSelf = !id || (currentUser && String(currentUser.id) === String(id));

    const { data: profileData, isLoading, mutate } = useSWR(
        targetId && (token || !token) ? `${API_URL}/api/users/${targetId}/profile` : null,
        async (url) => {
            const res = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            if (!res.ok) throw new Error('Failed to load profile');
            return res.json();
        },
        {
            revalidateOnFocus: false, // Don't refetch on window focus
            dedupingInterval: 60000,   // Cache for 1 minute
            revalidateIfStale: false   // Trust cache if exists
        }
    );

    const profileUser = profileData?.user;
    const isFollowing = profileData?.is_following;
    const stats = {
        followers_count: profileUser?.followers_count || 0,
        following_count: profileUser?.following_count || 0,
        post_count: profileUser?.post_count || 0
    };
    const loading = isLoading;

    const handleFollow = async () => {
        if (!currentUser) return navigate('/login');
        try {
            // Optimistic update
            const newIsFollowing = !isFollowing;
            const newCount = stats.followers_count + (newIsFollowing ? 1 : -1);

            mutate({
                ...profileData,
                is_following: newIsFollowing,
                user: { ...profileUser, followers_count: newCount }
            }, false); // false = don't revalidate immediately

            const res = await fetch(`${API_URL}/api/users/${targetId}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                mutate(); // Revalidate with server truth
            }
        } catch (e) { alert('Error'); mutate(); }
    };

    // Modal State
    const [activeModal, setActiveModal] = useState(null); // 'followers' | 'following' | null

    const Modal = ({ type, onClose }) => {
        const title = type === 'followers' ? '粉丝' : '关注';
        const { data: list } = useSWR(
            `${API_URL}/api/users/${targetId}/${type}`,
            (url) => fetch(url, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        );

        // Update local storage if viewing own followers
        useEffect(() => {
            if (isSelf && type === 'followers' && list && list.length > 0) {
                // Find latest created_at
                const latest = Math.max(...list.map(u => u.created_at));
                localStorage.setItem('last_seen_follower_at', latest);
            }
        }, [list]);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className="bg-white rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-oat-200 flex justify-between items-center">
                        <h3 className="font-bold text-ink">{title}</h3>
                        <button onClick={onClose} className="text-oat-400 hover:text-ink">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {!list ? <div className="p-8 text-center text-oat-400">Loading...</div> : (
                            list.length === 0 ? <div className="p-8 text-center text-oat-400">暂无{title}</div> : (
                                <div className="space-y-1">
                                    {list.map(u => (
                                        <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-oat-50 rounded-xl cursor-pointer" onClick={() => { navigate(`/profile/${u.id}`); onClose(); }}>
                                            <div className="w-10 h-10 rounded-full bg-haze-50 flex items-center justify-center text-haze-600 font-bold border border-oat-200">
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-ink text-sm">{u.username}</div>
                                                <div className="text-xs text-oat-400">
                                                    {/* Show active? */}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="min-h-screen bg-paper flex items-center justify-center"><div className="animate-spin text-haze-400">...</div></div>;
    if (!profileUser) return null;

    return (
        <div className="flex min-h-screen bg-paper">
            {activeModal && <Modal type={activeModal} onClose={() => setActiveModal(null)} />}

            <main className="flex-1 p-4 md:p-8 flex items-start justify-center pt-20">
                <div className="w-full max-w-2xl bg-white rounded-3xl shadow-soft border border-oat-200 overflow-hidden relative">

                    {/* Header Banner */}
                    <div className="h-32 bg-gradient-to-r from-oat-200 to-haze-100"></div>

                    <div className="px-8 pb-8">
                        {/* Avatar & Action */}
                        <div className="flex justify-between items-end -mt-10 mb-6">
                            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
                                <div className="w-full h-full rounded-full bg-haze-50 flex items-center justify-center text-3xl font-serif text-haze-600 font-bold border border-oat-200">
                                    {profileUser.username[0].toUpperCase()}
                                </div>
                            </div>

                            <div className="flex gap-3 mb-2">
                                {isSelf ? (
                                    <div className="flex gap-2">
                                        {currentUser?.role === 'admin' && (
                                            <button
                                                onClick={() => navigate('/admin')}
                                                className="px-4 py-2 rounded-full border border-oat-300 text-haze-600 bg-oat-50 hover:bg-oat-100 text-sm font-bold transition-all flex items-center gap-1"
                                            >
                                                <Compass size={16} />
                                                <span>管理面板</span>
                                            </button>
                                        )}
                                        <button onClick={logout} className="px-4 py-2 rounded-full border border-oat-300 text-rose-500 hover:bg-rose-50 text-sm font-bold transition-all">
                                            退出登录
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Chat Button if Friends? Or just always show? Logic check: only friends can chat. */}
                                        {/* Chat Button if Friends? Or just always show? Logic check: only friends can chat. */}
                                        <button
                                            onClick={handleFollow}
                                            className={`px-6 py-2 rounded-full text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${isFollowing
                                                ? 'bg-oat-100 text-haze-600 border border-haze-200'
                                                : 'bg-haze-600 text-white hover:bg-haze-700'
                                                }`}
                                        >
                                            {isFollowing ? '已关注' : '关注'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <h1 className="text-2xl font-serif font-bold text-ink mb-1">{profileUser.username}</h1>
                        <div className="flex items-center gap-4 text-sm text-oat-400 mb-6 font-medium">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(profileUser.created_at * 1000).toLocaleDateString()} 加入</span>
                            {profileUser.last_active_at && (
                                <span className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${(Date.now() / 1000 - profileUser.last_active_at) < 300 ? 'bg-green-400' : 'bg-gray-300'}`} />
                                    {(Date.now() / 1000 - profileUser.last_active_at) < 300 ? '在线' : '离线'}
                                </span>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 border-t border-oat-100 pt-6">
                            <div className="text-center">
                                <div className="text-xl font-bold text-ink font-serif">{stats.post_count}</div>
                                <div className="text-xs text-oat-400 font-bold tracking-wider uppercase">帖子</div>
                            </div>
                            <div className="text-center cursor-pointer hover:bg-oat-50 rounded-lg p-2 -m-2 transition-colors" onClick={() => setActiveModal('following')}>
                                <div className="text-xl font-bold text-ink font-serif">{stats.following_count}</div>
                                <div className="text-xs text-oat-400 font-bold tracking-wider uppercase">关注</div>
                            </div>
                            <div className="text-center cursor-pointer hover:bg-oat-50 rounded-lg p-2 -m-2 transition-colors" onClick={() => setActiveModal('followers')}>
                                <div className="text-xl font-bold text-ink font-serif">{stats.followers_count}</div>
                                <div className="text-xs text-oat-400 font-bold tracking-wider uppercase">粉丝</div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
