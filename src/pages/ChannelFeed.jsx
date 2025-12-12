import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PostListItem from '../components/PostListItem';
import { PenSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function ChannelFeed() {
    const { slug } = useParams();
    const { user, token, loading: authLoading } = useAuth();

    // Privacy: Hollow is hidden from public list view
    if (slug === 'hollow' && !authLoading) {
        if (!user || user.role !== 'admin') {
            return <Navigate to="/drifting" replace />;
        }
    }
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState(null);

    // New Post State
    const [isPosting, setIsPosting] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || '';

    // Mapping for display (could fetch from API)
    const CHANNEL_INFO = {
        'help': { name: '解忧杂货店', desc: '每一个烦恼都值得被温柔以待' },
        'hollow': { name: '树洞', desc: '说出你的秘密，风会带走它' },
        'stories': { name: '故事集', desc: '长篇叙事，分享你的人生片段' },
        'tech': { name: '极客公园', desc: '探讨技术与未来' },
        'music': { name: '音乐分享', desc: '一首歌，一个故事' },
        'books': { name: '深夜书房', desc: '阅读与思考' },
    };

    const info = CHANNEL_INFO[slug] || { name: '未知板块', desc: '' };

    useEffect(() => {
        fetchPosts();
    }, [slug]);

    const fetchPosts = async (cursor = null) => {
        setLoading(true);
        try {
            const url = `${API_URL}/api/channels/${slug}/messages${cursor ? `?cursor=${cursor}` : ''}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPosts(prev => cursor ? [...prev, ...data.data] : data.data);
                setNextCursor(data.next_cursor);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newContent.trim()) return;

        const res = await fetch(`${API_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                content: newContent,
                title: newTitle,
                channel_slug: slug,
                nickname: user?.username
            })
        });

        if (res.ok) {
            setIsPosting(false);
            setNewTitle('');
            setNewContent('');
            fetchPosts(); // Refresh
        }
    };

    return (
        <div className="flex min-h-screen bg-paper">
            <Sidebar />

            <main className="flex-1 md:ml-0 w-full max-w-4xl mx-auto border-x border-oat-200 min-h-screen bg-white shadow-soft pb-24 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-oat-200 p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-ink">{info.name}</h1>
                        <p className="text-sm text-oat-400 mt-1">{info.desc}</p>
                    </div>

                    <button
                        onClick={() => setIsPosting(true)}
                        className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                    >
                        <PenSquare size={16} />
                        <span>发帖</span>
                    </button>
                </div>

                {/* Posting Modal / Area */}
                {isPosting && (
                    <div className="p-6 bg-oat-50 border-b border-oat-200 animate-slide-up">
                        <input
                            className="w-full bg-transparent text-lg font-bold placeholder-oat-400 border-none outline-none mb-4 font-serif"
                            placeholder="标题 (可选)..."
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full bg-transparent min-h-[150px] outline-none text-ink placeholder-oat-400 resize-none leading-relaxed"
                            placeholder="写下你的心事..."
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setIsPosting(false)} className="text-oat-500 text-sm hover:text-ink">取消</button>
                            <button onClick={handlePost} className="btn-primary text-sm py-1.5 px-4">发布</button>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="divide-y divide-oat-100">
                    {posts.map(post => (
                        <PostListItem key={post.id} post={post} />
                    ))}

                    {loading && <div className="p-8 text-center text-oat-400 text-sm">加载中...</div>}

                    {!loading && posts.length === 0 && (
                        <div className="p-12 text-center text-oat-400">
                            这里还很安静...来写下第一篇故事吧。
                        </div>
                    )}

                    {nextCursor && !loading && (
                        <div className="p-6 text-center">
                            <button onClick={() => fetchPosts(nextCursor)} className="text-haze-400 hover:text-haze-600 font-medium text-sm">
                                加载更多
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
