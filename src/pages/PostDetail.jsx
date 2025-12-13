import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';

import Markdown from 'react-markdown';
import { ArrowLeft, Clock, MessageSquare, Heart, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/messages/${id}`);
            if (res.ok) {
                const data = await res.json();
                setPost(data.message);
                setComments(data.comments);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;
        if (!user) { alert('请登录'); return; }

        const res = await fetch(`${API_URL}/api/messages/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: newComment })
        });

        if (res.ok) {
            setNewComment('');
            fetchDetail(); // simple refresh
        }
    };

    if (!post && !loading) return <div className="text-center p-20">404 Not Found</div>;

    return (
        <div className="flex flex-col h-full bg-paper overflow-y-auto">


            <main className="flex-1 w-full max-w-4xl mx-auto border-x border-oat-200 min-h-screen bg-white shadow-soft flex flex-col pb-20 md:pb-0">
                {/* Nav Header */}
                <div className="p-4 border-b border-oat-200 sticky top-0 bg-white/95 backdrop-blur z-20 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-oat-100 rounded-full text-oat-400 hover:text-ink transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-serif font-bold text-ink mr-auto">
                        {post?.channel_name || '详情'}
                    </span>

                    {/* Post Actions */}
                    {post && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                    if (!user) return alert('请先登录');
                                    await fetch(`${API_URL}/api/messages/${id}/like`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    fetchDetail();
                                }}
                                className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors flex items-center gap-1"
                            >
                                <Heart size={20} className={post.liked_by_user ? "fill-rose-400" : ""} />
                                <span className="text-xs font-bold">{post.like_count || 0}</span>
                            </button>

                            {(user?.role === 'admin' || user?.id === post.user_id) && (
                                <button
                                    onClick={async () => {
                                        if (!confirm('确认删除?')) return;
                                        const res = await fetch(`${API_URL}/api/messages/${id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if (res.ok) navigate('/');
                                    }}
                                    className="p-2 text-oat-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="p-20 text-center text-oat-300">加载中...</div>
                ) : (
                    <>
                        <motion.article className="p-8 md:p-12"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {/* Title & Meta */}
                            <div className="mb-8 text-center">
                                {post.title && <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink mb-4 leading-tight">{post.title}</h1>}
                                <div className="flex items-center justify-center gap-4 text-sm text-oat-400 font-sans">
                                    <Link to={`/profile/${post.user_id}`} className="hover:text-haze-600 font-bold transition-colors">{post.nickname || '路人'}</Link>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {new Date(post.created_at * 1000).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="prose prose-lg prose-p:text-ink prose-p:font-serif prose-p:leading-loose mx-auto mb-16">
                                <Markdown>{post.content}</Markdown>
                            </div>
                        </motion.article>

                        {/* Comments Area */}
                        <div className="bg-oat-50 mt-auto border-t border-oat-200 p-8 md:p-12">
                            <h3 className="text-xl font-serif font-bold text-ink mb-8 flex items-center gap-2">
                                <MessageSquare size={20} />
                                <span>评论 ({comments.length})</span>
                            </h3>

                            <div className="space-y-6 mb-10">
                                {comments.map(c => (
                                    <div key={c.id} className="flex gap-4 group">
                                        <div className="w-8 h-8 rounded-full bg-white border border-oat-200 flex items-center justify-center text-xs font-bold text-oat-500 shrink-0">
                                            {c.username ? c.username[0].toUpperCase() : 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-sm font-bold text-ink">{c.username}</span>
                                                <span className="text-xs text-oat-300">{new Date(c.created_at * 1000).toLocaleString()}</span>
                                                {(user?.role === 'admin' || user?.id === c.user_id) && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('确认删除评论?')) return;
                                                            const res = await fetch(`${API_URL}/api/comments/${c.id}`, {
                                                                method: 'DELETE',
                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                            });
                                                            if (res.ok) fetchDetail();
                                                        }}
                                                        className="ml-auto text-oat-300 hover:text-rose-400 p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-oat-600 leading-relaxed text-sm md:text-base">{c.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {comments.length === 0 && <p className="text-oat-400 text-center text-sm">还没有人说话，也许此刻正是时候。</p>}
                            </div>

                            <div className="flex gap-4 items-center">
                                <input
                                    className="flex-1 bg-white border-oat-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-haze-100 transition-all text-ink placeholder-oat-300"
                                    placeholder="写下你的回应..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                                />
                                <button onClick={handleComment} className="btn-primary rounded-xl aspect-square flex items-center justify-center">
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

// Add these handlers inside component before return
/* 
    const handleLike = async () => {
        if (!user) return alert('请先登录');
        await fetch(`${API_URL}/api/messages/${id}/like`, { 
            method: 'POST', 
            headers: {'Authorization': `Bearer ${token}`} 
        });
        fetchDetail(); // Refresh to get updated count
    };

    const handleDeletePost = async () => {
        if (!confirm('确认删除?')) return;
        const res = await fetch(`${API_URL}/api/messages/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });
        if (res.ok) navigate('/');
    };

    const handleDeleteComment = async (cid) => {
        if (!confirm('确认删除评论?')) return;
        const res = await fetch(`${API_URL}/api/comments/${cid}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });
        if (res.ok) fetchDetail();
    };
*/
