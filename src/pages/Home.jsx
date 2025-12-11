import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import Markdown from 'react-markdown';
import { Send, Heart, MessageCircle, Trash2, X } from 'lucide-react';

export default function Home() {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState(null);
    const [comments, setComments] = useState({}); // { msgId: [comments] }
    const [newComment, setNewComment] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
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
        if (!user) { alert('请先登录'); return; }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content, nickname: user?.username })
            });
            if (res.ok) {
                setContent('');
                fetchMessages();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (id) => {
        if (!user) { alert('请先登录'); return; }
        // Optimistic update
        setMessages(prev => prev.map(m => {
            if (m.id === id) return { ...m, like_count: m.like_count + 1 };
            return m;
        }));

        try {
            const res = await fetch(`${API_URL}/api/messages/${id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // Correct count if unlike (logic simplified for brevity, ideally fetch fresh count or handle unlike state)
            if (!data.liked) {
                setMessages(prev => prev.map(m => {
                    if (m.id === id) return { ...m, like_count: Math.max(0, m.like_count - 2) }; // -2 cause we +1d prematurely
                    return m;
                }));
                fetchMessages(); // Sync to be safe
            }
        } catch (e) { fetchMessages(); }
    };

    const handleDelete = async (id) => {
        if (!confirm('确认删除?')) return;
        try {
            const res = await fetch(`${API_URL}/api/messages/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessages(messages.filter(m => m.id !== id));
            } else {
                alert('删除失败');
            }
        } catch (e) { }
    };

    const toggleComments = async (id) => {
        if (activeCommentId === id) {
            setActiveCommentId(null);
            return;
        }
        setActiveCommentId(id);
        if (!comments[id]) {
            const res = await fetch(`${API_URL}/api/messages/${id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(prev => ({ ...prev, [id]: data }));
            }
        }
    };

    const submitComment = async (id) => {
        if (!newComment.trim()) return;
        if (!user) { alert('请先登录'); return; }

        const res = await fetch(`${API_URL}/api/messages/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: newComment })
        });
        if (res.ok) {
            setNewComment('');
            // Refresh comments
            const cRes = await fetch(`${API_URL}/api/messages/${id}/comments`);
            const cData = await cRes.json();
            setComments(prev => ({ ...prev, [id]: cData }));
            // Refresh message count
            setMessages(prev => prev.map(m => m.id === id ? { ...m, comment_count: m.comment_count + 1 } : m));
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
                            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send size={16} /> 发布
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
                                {/* Delete Button for Owner or Admin */}
                                {user && (user.id === msg.user_id || user.role === 'admin') && (
                                    <button onClick={() => handleDelete(msg.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="prose prose-sm text-gray-700 mb-4 max-w-none">
                                <Markdown>{msg.content}</Markdown>
                            </div>

                            <div className="flex items-center gap-6 text-gray-400 border-t border-gray-50 pt-3">
                                <button onClick={() => handleLike(msg.id)} className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                                    <Heart size={18} />
                                    <span className="text-xs">{msg.like_count || 0}</span>
                                </button>
                                <button onClick={() => toggleComments(msg.id)} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                    <MessageCircle size={18} />
                                    <span className="text-xs">{msg.comment_count || 0}</span>
                                </button>
                            </div>

                            {/* Comments Section */}
                            {activeCommentId === msg.id && (
                                <div className="mt-4 bg-gray-50 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-3 mb-4">
                                        {comments[msg.id]?.map(c => (
                                            <div key={c.id} className="text-sm">
                                                <span className="font-bold text-gray-700">{c.username || 'Anonymous'}:</span>
                                                <span className="text-gray-600 ml-2">{c.content}</span>
                                            </div>
                                        ))}
                                        {(!comments[msg.id] || comments[msg.id].length === 0) && <p className="text-xs text-gray-400">暂无评论</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="写评论..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && submitComment(msg.id)}
                                        />
                                        <button onClick={() => submitComment(msg.id)} className="text-blue-600 font-medium text-sm hover:underline">发送</button>
                                    </div>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            </main>
        </div>
    );
}
