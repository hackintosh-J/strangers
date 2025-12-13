import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, Flame, MessageSquare, Heart, Eye, Ship } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';
import Skeleton from '../components/Skeleton';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
    const { user } = useAuth();
    const [channels, setChannels] = useState([]);
    const [hotPosts, setHotPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [channelsRes, postsRes] = await Promise.all([
                    fetch(`${API_URL}/api/channels`),
                    fetch(`${API_URL}/api/messages?sort=hot&limit=5`)
                ]);

                const channelsData = await channelsRes.json();
                const postsData = await postsRes.json();

                setChannels(channelsData);
                if (postsData.data) setHotPosts(postsData.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex min-h-screen bg-oat-50">
            <Sidebar />

            <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">

                {/* Header: Logo & Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 pt-4"
                >
                    <div className="flex items-center gap-2 mb-4 opacity-50">
                        <span className="font-hand text-xl tracking-widest">THE STRANGERS</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-serif font-bold text-haze-900 leading-tight">
                        欢迎回家，
                        <span className="text-haze-600 border-b-4 border-oat-200 inline-block px-1">
                            {user ? user.username : '陌生人'}
                        </span>。
                    </h1>
                </motion.div>

                {/* Drifting Bottle (Prominent Entry) */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-10"
                >
                    <Link to="/drifting" className="block relative w-full bg-gradient-to-br from-haze-500 to-haze-400 rounded-3xl p-6 md:p-8 shadow-lg shadow-haze-200/50 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center text-white">
                            <div>
                                <h2 className="text-2xl font-bold font-serif mb-2 flex items-center gap-2">
                                    <Ship className="animate-pulse" /> 漂流瓶
                                </h2>
                                <p className="text-haze-50 opacity-90 text-sm md:text-base font-medium max-w-sm">
                                    去海边捡一个瓶子，或者把心事写进信笺，扔向无尽的蔚蓝。
                                </p>
                            </div>
                            <div className="hidden md:block">
                                <span className="px-5 py-2 bg-white/20 backdrop-blur-sm rounded-full font-bold text-sm border border-white/30 group-hover:bg-white/30 transition-colors">
                                    即刻启程 &rarr;
                                </span>
                            </div>
                        </div>
                        {/* Decor */}
                        <Ship size={120} className="absolute -bottom-6 -right-6 text-white/10 rotate-12 group-hover:rotate-6 transition-transform duration-700" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </Link>
                </motion.section>

                {/* Hot Topics (Dominant) */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6 text-ink font-serif font-bold text-xl">
                        <Flame size={20} className="text-rose-400 fill-rose-400" />
                        <h2>热门动态</h2>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {loading ? (
                            // Skeleton Loading State
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white rounded-2xl p-5 border border-oat-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <Skeleton className="h-6 w-2/3" />
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                        <Skeleton className="h-4 w-full mb-2" />
                                        <Skeleton className="h-4 w-5/6 mb-4" />
                                        <div className="flex gap-4">
                                            <Skeleton className="h-4 w-8" />
                                            <Skeleton className="h-4 w-8" />
                                            <Skeleton className="h-4 w-8" />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : hotPosts.length > 0 ? (
                            hotPosts.map(post => (
                                <motion.div key={post.id} variants={itemVariants}>
                                    <Link to={`/post/${post.id}`} className="block bg-white rounded-2xl p-5 border border-oat-200 shadow-sm hover:shadow-md transition-all group">
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
                                </motion.div>
                            ))
                        ) : (
                            <div className="bg-white rounded-2xl border border-oat-200 p-8 text-center text-oat-400 italic">
                                正在加载热门内容...
                            </div>
                        )}
                    </motion.div>
                </section>

                {/* Channels (Minimal Row) */}
                <section className="mb-24 md:mb-8">
                    <div className="flex items-center gap-2 mb-4 text-ink font-serif font-bold text-lg opacity-80">
                        <span className="w-1 h-5 bg-oat-400 rounded-full" />
                        <h2>探索板块</h2>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {loading ? (
                            // Channel Skeletons
                            [1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex flex-col items-center gap-2 min-w-[4rem]">
                                    <Skeleton className="w-16 h-16 rounded-full" />
                                    <Skeleton className="w-10 h-3" />
                                </div>
                            ))
                        ) : (
                            channels.map(c => (
                                <Link key={c.id} to={`/channel/${c.slug}`} className="flex flex-col items-center gap-2 min-w-[4rem] group">
                                    <div className="w-16 h-16 rounded-full bg-white border border-oat-200 shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 group-hover:border-haze-300 transition-all">
                                        {c.icon}
                                    </div>
                                    <span className="text-xs text-oat-500 font-medium group-hover:text-haze-600 transition-colors">{c.name}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
}
