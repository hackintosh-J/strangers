import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ArrowRight, Flame, MessageSquare, Heart, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Dashboard() {
    const [channels, setChannels] = useState([]);
    const [hotPosts, setHotPosts] = useState([]);
    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        // Fetch Channels
        fetch(`${API_URL}/api/channels`)
            .then(res => res.json())
            .then(data => setChannels(data))
            .catch(console.error);

        // Fetch Hot Posts
        fetch(`${API_URL}/api/messages?sort=hot&limit=5`)
            .then(res => res.json())
            .then(res => {
                if (res.data) setHotPosts(res.data);
            })
            .catch(console.error);
    }, []);



    return (
        <div className="flex min-h-screen bg-paper">
            <Sidebar />

            <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
                {/* Welcome Banner */}
                <div className="bg-oat-100 rounded-3xl p-8 md:p-12 text-ink mb-12 shadow-sm relative overflow-hidden border border-oat-200">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 text-haze-900">欢迎回家，陌生人。</h1>
                        <p className="text-haze-700/80 text-lg md:text-xl max-w-2xl font-serif">
                            这是一个温暖的角落。在这里，你可以卸下防备，诉说心事，或者静静地阅读他人的故事。
                        </p>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                </div>

                {/* Hot Topics (Dominant) */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6 text-ink font-serif font-bold text-xl">
                        <Flame size={20} className="text-rose-400 fill-rose-400" />
                        <h2>热门动态</h2>
                    </div>

                    <div className="space-y-4">
                        {hotPosts.length > 0 ? hotPosts.map(post => (
                            <Link key={post.id} to={`/post/${post.id}`} className="block bg-white rounded-2xl p-5 border border-oat-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-ink line-clamp-1 group-hover:text-haze-600 transition-colors">
                                        {post.title || post.content.slice(0, 20)}
                                    </h3>
                                    <span className="text-xs text-oat-400 whitespace-nowrap ml-4">
                                        {formatDistanceToNow(new Date(post.created_at * 1000), { addSuffix: true, locale: zhCN })}
                                    </span>
                                </div>
                                <p className="text-oat-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-4 text-xs font-medium text-oat-400">
                                    <div className="flex items-center gap-1">
                                        <Eye size={14} />
                                        <span>{post.view_count || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Heart size={14} />
                                        <span>{post.like_count || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare size={14} />
                                        <span>{post.comment_count || 0}</span>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-oat-100 flex items-center justify-center text-[10px] text-oat-500">
                                            {post.username?.[0]?.toUpperCase()}
                                        </div>
                                        <span>{post.username}</span>
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="bg-white rounded-2xl border border-oat-200 p-8 text-center text-oat-400 italic">
                                正在加载热门内容...
                            </div>
                        )}
                    </div>
                </section>

                {/* Channels (Minimal Row) */}
                <section className="mb-24 md:mb-8">
                    <div className="flex items-center gap-2 mb-4 text-ink font-serif font-bold text-lg opacity-80">
                        <span className="w-1 h-5 bg-oat-400 rounded-full" />
                        <h2>探索板块</h2>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {channels.map(c => (
                            <Link key={c.id} to={`/channel/${c.slug}`} className="flex flex-col items-center gap-2 min-w-[4rem] group">
                                <div className="w-16 h-16 rounded-full bg-white border border-oat-200 shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 group-hover:border-haze-300 transition-all">
                                    {c.icon}
                                </div>
                                <span className="text-xs text-oat-500 font-medium group-hover:text-haze-600 transition-colors">{c.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}
