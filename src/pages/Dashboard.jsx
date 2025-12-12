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

    const ChannelCard = ({ channel }) => (
        <Link to={`/channel/${channel.slug}`} className="block group">
            <div className="bg-white rounded-2xl p-6 border border-oat-200 shadow-soft transition-all h-full flex flex-col items-center text-center hover:shadow-float">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 transform grayscale group-hover:grayscale-0">
                    {channel.icon}
                </div>
                <h3 className="text-xl font-serif font-bold text-ink mb-2">{channel.name}</h3>
                <p className="text-oat-400 text-sm line-clamp-2">{channel.description}</p>
                <div className="mt-auto pt-4 flex items-center gap-1 text-haze-400 text-sm font-medium group-hover:text-haze-600">
                    <span>进入板块</span>
                    <ArrowRight size={16} />
                </div>
            </div>
        </Link>
    );

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

                {/* Channels Grid */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6 text-ink font-serif font-bold text-xl">
                        <span className="w-1 h-6 bg-haze-400 rounded-full" />
                        <h2>探索板块</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {channels.length > 0 ? channels.map(c => (
                            <ChannelCard key={c.id} channel={c} />
                        )) : (
                            // Skeleton / Fallback while fetching or if empty
                            <>
                                <div className="h-48 bg-oat-50 rounded-2xl animate-pulse" />
                                <div className="h-48 bg-oat-50 rounded-2xl animate-pulse" />
                                <div className="h-48 bg-oat-50 rounded-2xl animate-pulse" />
                            </>
                        )}
                    </div>
                </section>

                {/* Latest / Hot */}
                <section>
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

            </main>
        </div>
    );
}
