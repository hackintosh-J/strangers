import React, { useEffect, useState } from 'react';
import useSWR from 'swr';

import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { MessageCircle, UserCheck, Loader2 } from 'lucide-react';

export default function Friends() {
    const { user, token } = useAuth();


    const API_URL = import.meta.env.VITE_API_URL || '';

    const fetcher = (url) => fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).then(res => res.json());

    const { data: friendsData, isLoading } = useSWR(token ? `${API_URL}/api/friends` : null, fetcher);
    const friends = friendsData || [];
    const loading = isLoading;

    return (
        <div className="flex min-h-screen bg-paper">

            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-serif font-bold text-ink mb-6 flex items-center gap-2">
                        <UserCheck className="text-haze-500" /> 好友列表 <span className="text-sm text-oat-400 font-normal ml-2">互相关注即为好友</span>
                    </h1>

                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-oat-400" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {friends.length === 0 ? (
                                <div className="col-span-full text-center py-20 text-oat-400 italic bg-white rounded-2xl border border-oat-200">
                                    暂无好友，去社区里找找有趣的灵魂吧。
                                </div>
                            ) : (
                                friends.map(f => {
                                    const isOnline = f.last_active_at && (Date.now() / 1000 - f.last_active_at) < 300;
                                    return (
                                        <div key={f.id} className="bg-white p-4 rounded-xl border border-oat-200 shadow-sm flex items-center justify-between hover:shadow-float transition-all">
                                            <Link to={`/profile/${f.id}`} className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full bg-haze-50 flex items-center justify-center font-bold text-haze-600">
                                                        {f.username[0].toUpperCase()}
                                                    </div>
                                                    {isOnline && (
                                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-ink">{f.username}</div>
                                                    <div className="text-xs text-oat-400">
                                                        {isOnline ? '在线' : '离线'}
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                to={`/chat/${f.id}`}
                                                className="p-2 text-haze-500 hover:bg-haze-50 rounded-full transition-colors"
                                            >
                                                <MessageCircle size={20} />
                                            </Link>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
