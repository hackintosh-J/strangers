import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Markdown from 'react-markdown';
import { ArrowLeft, Clock, MessageSquare, Heart, Send } from 'lucide-react';
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
        <div className="flex min-h-screen bg-paper">
            <Sidebar />

            <main className="flex-1 w-full max-w-4xl mx-auto border-x border-warm-100 min-h-screen bg-white shadow-sm flex flex-col">
                {/* Nav Header */}
                <div className="p-4 border-b border-warm-100 sticky top-0 bg-white/95 backdrop-blur z-20 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-warm-50 rounded-full text-pencil transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-serif font-bold text-ink">
                        {post?.channel_name || '详情'}
                    </span>
                </div>

                {loading ? (
                    <div className="p-20 text-center text-warm-300">加载中...</div>
                ) : (
                    <>
                        <article className="p-8 md:p-12 animate-fade-in">
                            {/* Title & Meta */}
                            <div className="mb-8 text-center">
                                {post.title && <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink mb-4 leading-tight">{post.title}</h1>}
                                <div className="flex items-center justify-center gap-4 text-sm text-warm-400 font-sans">
                                    <span>{post.nickname || '路人'}</span>
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
                        </article>

                        {/* Comments Area */}
                        <div className="bg-warm-50 mt-auto border-t border-warm-100 p-8 md:p-12">
                            <h3 className="text-xl font-serif font-bold text-ink mb-8 flex items-center gap-2">
                                <MessageSquare size={20} />
                                <span>评论 ({comments.length})</span>
                            </h3>

                            <div className="space-y-6 mb-10">
                                {comments.map(c => (
                                    <div key={c.id} className="flex gap-4 group">
                                        <div className="w-8 h-8 rounded-full bg-white border border-warm-100 flex items-center justify-center text-xs font-bold text-warm-500 shrink-0">
                                            {c.username ? c.username[0].toUpperCase() : 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-sm font-bold text-ink">{c.username}</span>
                                                <span className="text-xs text-warm-300">{new Date(c.created_at * 1000).toLocaleString()}</span>
                                            </div>
                                            <p className="text-pencil leading-relaxed text-sm md:text-base">{c.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {comments.length === 0 && <p className="text-warm-300 text-center text-sm">还没有人说话，也许此刻正是时候。</p>}
                            </div>

                            {/* Comment Input */}
                            <div className="flex gap-4">
                                <input
                                    className="flex-1 bg-white border-warm-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-warm-100 transition-all text-ink placeholder-warm-300"
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
