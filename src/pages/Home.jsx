import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Send, Heart, MessageCircle } from 'lucide-react';

export default function Home() {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            // In dev with Vite proxy or full URL
            const res = await fetch(`${API_URL}/api/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        if (!user) {
            alert('请先登录');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, nickname: user.username })
            });
            if (res.ok) {
                setContent('');
                fetchMessages();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-10">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4">
                {/* Write Box */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
                    <textarea
                        className="w-full resize-none outline-none text-gray-700 placeholder-gray-400 min-h-[100px]"
                        placeholder="写下此刻的想法..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-4 border-t border-gray-50 pt-3">
                        <span className="text-xs text-gray-400">支持 Markdown</span>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !content.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            <Send size={16} />
                            发布
                        </button>
                    </div>
                </div>

                {/* Feed */}
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <article key={msg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-xs text-gray-600 font-bold">
                                        {msg.nickname ? msg.nickname[0].toUpperCase() : 'A'}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">{msg.nickname || 'Anonymous'}</h3>
                                        <time className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</time>
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-sm text-gray-700 mb-4">
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            <div className="flex items-center gap-6 text-gray-400">
                                <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                                    <Heart size={18} />
                                    <span className="text-xs">{msg.like_count || 0}</span>
                                </button>
                                <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                    <MessageCircle size={18} />
                                    <span className="text-xs">{msg.comment_count || 0}</span>
                                </button>
                            </div>
                        </article>
                    ))}

                    {messages.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <p>暂无内容，来做第一个发声的人吧。</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
