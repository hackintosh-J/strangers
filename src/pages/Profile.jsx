
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Calendar, MessageSquare, Users, Heart, Compass } from 'lucide-react';

export default function Profile() {
    const { user: currentUser, token, logout } = useAuth();
    const { id } = useParams(); // If id exists, viewing other. Else viewing self.
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState(null);
    const [stats, setStats] = useState({ followers_count: 0, following_count: 0, post_count: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || '';

    // Determine target ID
    const targetId = id || currentUser?.id;
    const isSelf = !id || (currentUser && String(currentUser.id) === String(id));

    useEffect(() => {
        if (!targetId) {
            if (!currentUser) navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            // Check Cache
            const cacheKey = `profile_cache_${targetId}`;
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const { user, stats, isFollowing, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < 60000) { // 1 min cache
                        setProfileUser(user);
                        setStats(stats);
                        setIsFollowing(isFollowing);
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.warn('Cache parse error, clearing:', e);
                sessionStorage.removeItem(cacheKey);
            }

            try {
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch(`${API_URL}/api/users/${targetId}/profile`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setProfileUser(data.user);

                    const newStats = {
                        followers_count: data.user.followers_count || 0,
                        following_count: data.user.following_count || 0,
                        post_count: data.user.post_count || 0
                    };
                    setStats(newStats);
                    setIsFollowing(data.is_following);

                    // Set Cache
                    sessionStorage.setItem(cacheKey, JSON.stringify({
                        user: data.user,
                        stats: newStats,
                        isFollowing: data.is_following,
                        timestamp: Date.now()
                    }));

                } else {
                    // Handle 404
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [targetId, token]);

    const handleFollow = async () => {
        if (!currentUser) return navigate('/login');
        try {
            const res = await fetch(`${API_URL}/api/users/${targetId}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsFollowing(data.following);
                setStats(prev => ({
                    ...prev,
                    followers_count: prev.followers_count + (data.following ? 1 : -1)
                }));
            }
        } catch (e) { alert('Error'); }
    };

    if (loading) return <div className="min-h-screen bg-paper flex items-center justify-center"><div className="animate-spin text-haze-400">...</div></div>;
    if (!profileUser) return null;

    return (
        <div className="flex min-h-screen bg-paper">
            <Sidebar />
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
                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(profileUser.created_at).toLocaleDateString()} 加入</span>
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
                            <div className="text-center">
                                <div className="text-xl font-bold text-ink font-serif">{stats.following_count}</div>
                                <div className="text-xs text-oat-400 font-bold tracking-wider uppercase">关注</div>
                            </div>
                            <div className="text-center">
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
