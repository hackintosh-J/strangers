import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import Markdown from 'react-markdown';
import { Send, Heart, MessageCircle, Trash2, Smile, MoreHorizontal } from 'lucide-react';

export default function Home() {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState(null);
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState('');
    const [nextCursor, setNextCursor] = useState(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '';
    const EMOJIS = ['😊', '🫂', '❤️', '🌟', '💪', '🌸', '☕', '🐱', '🐶', '🌙'];

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async (cursor = null) => {
        try {
            const url = cursor
                ? `${API_URL}/api/messages?cursor=${cursor}`
                : `${API_URL}/api/messages`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                // If it's a new page (cursor present), append. If init (no cursor), set.
                if (data.data) {
                    setMessages(prev => cursor ? [...prev, ...data.data] : data.data);
                    setNextCursor(data.next_cursor);
                } else {
                    // Fallback for old API structure if any
                    setMessages(data);
                }
            }
        } catch (e) { console.error(e); } finally {
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (nextCursor) {
            setIsLoadingMore(true);
            fetchMessages(nextCursor);
        }
    };

    const addEmoji = (emoji) => {
        setContent(prev => prev + emoji);
        setShowEmojiPicker(false);
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
                fetchMessages(); // Refresh top
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (id) => {
        if (!user) { alert('请先登录'); return; }
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
            if (!data.liked) {
                setMessages(prev => prev.map(m => {
                    if (m.id === id) return { ...m, like_count: Math.max(0, m.like_count - 2) };
                    return m;
                }));
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

    const handleDeleteComment = async (msgId, commentId) => {
        if (!confirm('删除这条评论?')) return;
        try {
            const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setComments(prev => ({
                    ...prev,
                    [msgId]: prev[msgId].filter(c => c.id !== commentId)
                }));
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, comment_count: Math.max(0, m.comment_count - 1) } : m));
            }
        } catch (e) { alert('删除失败'); }
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
            const cRes = await fetch(`${API_URL}/api/messages/${id}/comments`);
            const cData = await cRes.json();
            setComments(prev => ({ ...prev, [id]: cData }));
            setMessages(prev => prev.map(m => m.id === id ? { ...m, comment_count: m.comment_count + 1 } : m));
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4">
                {/* Intro */}
                <div className="text-center mb-10 animate-fade-in">
                    <h1 className="text-3xl font-serif text-ink mb-2">在这里，交换温暖</h1>
                    <p className="text-pencil font-hand text-lg">"虽然我们素未谋面，但我愿意倾听你的故事。"</p>
                </div>

                {/* Write Box */}
                <div className="card p-6 mb-10 transition-all focus-within:ring-2 focus-within:ring-warm-100 relative">
                    <textarea
                        className="w-full resize-none outline-none text-ink placeholder-warm-300 min-h-[120px] bg-transparent font-serif leading-relaxed"
                        placeholder="今天发生了什么想说的事吗？..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-warm-100">
                        <div className="flex gap-2 text-warm-400 relative">
                            <Smile
                                size={20}
                                className="hover:text-warm-600 cursor-pointer"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            />
                            {showEmojiPicker && (
                                <div className="absolute top-8 left-0 bg-white shadow-lg rounded-xl p-3 grid grid-cols-5 gap-2 border border-warm-100 z-10 w-48">
                                    {EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => addEmoji(emoji)}
                                            className="text-xl hover:bg-warm-50 rounded p-1 transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !content.trim()}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} /> 寄出
                        </button>
                    </div>
                </div>

                {/* Feed */}
                <div className="space-y-8">
                    {messages.map((msg, index) => (
                        <article
                            key={msg.id}
                            className="card p-8 animate-slide-up"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center text-warm-600 font-serif font-bold text-lg">
                                        {msg.nickname ? msg.nickname[0].toUpperCase() : 'S'}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-ink">{msg.nickname || '路人'}</h3>
                                        <time className="text-xs text-pencil">
                                            {/* Fix: Multiply by 1000 for seconds -> ms */}
                                            {new Date(msg.created_at * 1000).toLocaleString()}
                                        </time>
                                    </div>
                                </div>
                                {user && (user.id === msg.user_id || user.role === 'admin') && (
                                    <button onClick={() => handleDelete(msg.id)} className="btn-ghost text-warm-200 hover:text-red-400">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="prose prose-p:text-ink prose-p:font-serif prose-p:leading-loose mb-6 max-w-none">
                                <Markdown>{msg.content}</Markdown>
                            </div>

                            <div className="flex items-center gap-6 pt-4 border-t border-warm-50">
                                <button onClick={() => handleLike(msg.id)} className="flex items-center gap-2 text-pencil hover:text-warm-500 transition-colors group">
                                    <div className="p-2 rounded-full group-hover:bg-warm-50 transition-colors">
                                        <Heart size={20} className={msg.like_count > 0 ? "fill-warm-400 text-warm-400" : ""} />
                                    </div>
                                    <span className="text-sm font-medium">{msg.like_count || 0}</span>
                                </button>
                                <button onClick={() => toggleComments(msg.id)} className="flex items-center gap-2 text-pencil hover:text-sage-500 transition-colors group">
                                    <div className="p-2 rounded-full group-hover:bg-sage-50 transition-colors">
                                        <MessageCircle size={20} />
                                    </div>
                                    <span className="text-sm font-medium">{msg.comment_count || 0}</span>
                                </button>
                            </div>

                            {/* Comments Section */}
                            {activeCommentId === msg.id && (
                                <div className="mt-6 bg-warm-50/50 rounded-xl p-6 border border-warm-100 animate-fade-in">
                                    <div className="space-y-4 mb-6">
                                        {comments[msg.id]?.map(c => (
                                            <div key={c.id} className="group relative pr-8">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="font-bold text-sm text-ink">{c.username || '路人'}:</span>
                                                    <span className="text-xs text-warm-400">{new Date(c.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-pencil text-sm pl-0">{c.content}</p>

                                                {/* Comment Delete Btn */}
                                                {user && (user.id === c.user_id || user.role === 'admin') && (
                                                    <button
                                                        onClick={() => handleDeleteComment(msg.id, c.id)}
                                                        className="absolute right-0 top-0 text-warm-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {(!comments[msg.id] || comments[msg.id].length === 0) && <p className="text-sm text-warm-300 italic text-center py-2">还没有人回复，给TA第一个拥抱吧...</p>}
                                    </div>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            className="input-warm text-sm py-2"
                                            placeholder="写下温暖的回复..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && submitComment(msg.id)}
                                        />
                                        <button onClick={() => submitComment(msg.id)} className="text-warm-600 font-medium text-sm hover:underline shrink-0">发送</button>
                                    </div>
                                </div>
                            )}
                        </article>
                    ))}

                    {/* Pagination Load More */}
                    {nextCursor && (
                        <div className="flex justify-center pt-6">
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="px-6 py-2 bg-white border border-warm-200 text-pencil rounded-full hover:bg-warm-50 transition-colors text-sm disabled:opacity-50"
                            >
                                {isLoadingMore ? '加载中...' : '查看更早的故事'}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

