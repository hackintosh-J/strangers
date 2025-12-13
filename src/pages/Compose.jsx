import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { PenTool, ChevronDown, Loader2 } from 'lucide-react';

export default function Compose() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Default to 'help' or 'stories'
    const [channel, setChannel] = useState('help');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '';

    const [channels, setChannels] = useState([]);

    useEffect(() => {
        // Fetch channels from API to ensure we have the latest list (including new ones)
        fetch(`${API_URL}/api/channels`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setChannels(data);
                }
            })
            .catch(err => {
                console.error("Failed to load channels", err);
                // Fallback if API fails
                setChannels([
                    { slug: 'help', name: '解忧杂货店', icon: '📪' },
                    { slug: 'hollow', name: '树洞', icon: '🌲' },
                    { slug: 'stories', name: '故事集', icon: '📖' },
                ]);
            });
    }, []);

    const handlePost = async () => {
        if (!content.trim()) return;
        if (!user) return navigate('/login');

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    content,
                    channel_slug: channel,
                    nickname: user.username
                })
            });

            if (res.ok) {
                const data = await res.json();
                navigate(`/post/${data.id}`); // Go to post
            } else {
                alert('发布失败');
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-paper">

            <main className="flex-1 w-full max-w-3xl mx-auto border-x border-oat-200 min-h-screen bg-white shadow-soft">
                {/* Header */}
                <div className="p-4 border-b border-oat-200 flex justify-between items-center bg-white/95 backdrop-blur sticky top-0 z-10">
                    <h1 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
                        <PenTool size={20} className="text-haze-500" />
                        写点什么
                    </h1>
                    <button
                        onClick={handlePost}
                        disabled={loading || !content.trim()}
                        className="btn-primary py-2 px-6 rounded-full text-sm font-bold disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : '发布'}
                    </button>
                </div>

                {/* Editor */}
                <div className="p-6 md:p-8 space-y-6">
                    {/* Channel Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-oat-400 uppercase tracking-widest">发布到</label>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {channels.map(ch => (
                                <button
                                    key={ch.slug}
                                    onClick={() => setChannel(ch.slug)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap
                                        ${channel === ch.slug
                                            ? 'bg-haze-50 border-haze-500 text-haze-700 shadow-sm'
                                            : 'border-oat-200 text-oat-500 hover:border-haze-300'
                                        }
                                    `}
                                >
                                    <span>{ch.icon}</span>
                                    <span className="font-medium">{ch.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <input
                            className="w-full text-2xl md:text-3xl font-serif font-bold placeholder-oat-300 border-none outline-none bg-transparent"
                            placeholder="标题 (可选)"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Content */}
                    <div className="h-full">
                        <textarea
                            className="w-full min-h-[400px] text-lg leading-relaxed placeholder-oat-300 border-none outline-none resize-none bg-transparent font-serif"
                            placeholder="在这里写下你的故事..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
