import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ArrowLeft, Send, MailOpen, X, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import oceanBg from '../assets/ocean.png';

export default function Drifting() {
    const { user, token } = useAuth();
    const [mode, setMode] = useState(null); // 'throw', 'pick', 'view'
    const [message, setMessage] = useState('');
    const [pickedBottle, setPickedBottle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const throwBottle = async () => {
        if (!message.trim()) return;
        if (!user) return showToast('请先登录再扔漂流瓶');

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: message,
                    channel_slug: 'hollow', // Drifting messages go to the Hollow
                    nickname: '漂流者'
                })
            });
            if (res.ok) {
                setMessage('');
                setMode(null);
                showToast('瓶子已经扔进海里了...');
            } else {
                showToast('扔瓶子失败了');
            }
        } catch (e) {
            showToast('网络错误');
        } finally {
            setLoading(false);
        }
    };

    const pickBottle = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/bottles/random`);
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    setPickedBottle(data.data);
                    setMode('view');
                } else {
                    showToast('海里空空如也...');
                }
            }
        } catch (e) {
            showToast('捞瓶子失败了');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-oat-50 overflow-hidden relative">
            <Sidebar />

            <main className="flex-1 relative w-full h-full flex flex-col items-center justify-center p-4">



                // ... (inside component)
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={oceanBg}
                        alt="Ocean Background"
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-haze-100/30 backdrop-blur-[2px]" />
                </div>
                {/* <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-haze-200/40 rounded-t-[50%] blur-3xl animate-pulse" /> */}
                <div className="absolute bottom-0 left-0 right-0 h-48 wave-pattern opacity-40 z-0" />

                {/* Main Content */}
                <div className="z-10 text-center animate-fade-in flex flex-col items-center justify-center h-full pb-20 md:pb-0">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-haze-800 mb-6 drop-shadow-sm">漂流瓶</h1>
                    <p className="text-haze-600 mb-12 text-lg font-serif italic">
                        有些话，只能说给大海听。
                    </p>

                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center">
                        <button
                            onClick={() => setMode('throw')}
                            className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/90 backdrop-blur shadow-float hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group border border-oat-200 hover:border-haze-300"
                        >
                            <Send size={28} className="text-haze-400 group-hover:text-haze-600 transition-colors md:w-8 md:h-8" />
                            <span className="font-serif font-bold text-ink text-sm md:text-base">扔一个</span>
                        </button>

                        <button
                            onClick={pickBottle}
                            disabled={loading}
                            className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/90 backdrop-blur shadow-float hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group border border-oat-200 hover:border-haze-300"
                        >
                            {loading ? <Loader2 size={28} className="animate-spin text-oat-400" /> : <MailOpen size={28} className="text-rose-400 group-hover:text-rose-600 transition-colors md:w-8 md:h-8" />}
                            <span className="font-serif font-bold text-ink text-sm md:text-base">捞一个</span>
                        </button>
                    </div>
                </div>

                {/* Modal: Throw */}
                {mode === 'throw' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-slide-up bg-paper-texture">
                            <button onClick={() => setMode(null)} className="absolute top-4 right-4 p-2 text-oat-400 hover:text-ink"><X size={24} /></button>
                            <h3 className="text-xl font-serif font-bold text-ink mb-6 text-center">写下心事</h3>
                            <textarea
                                className="w-full h-48 bg-oat-50/50 rounded-xl p-4 text-ink placeholder-oat-400 focus:outline-none focus:ring-2 focus:ring-haze-100 resize-none mb-6 font-hand text-lg leading-relaxed"
                                placeholder="此刻，你想对大海说什么？"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                            />
                            <button onClick={throwBottle} disabled={loading} className="w-full btn-primary py-3 rounded-full text-lg">
                                {loading ? '封存中...' : '扔进海里'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal: View */}
                {mode === 'view' && pickedBottle && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-slide-up bg-paper-texture">
                            <button onClick={() => { setMode(null); setPickedBottle(null); }} className="absolute top-4 right-4 p-2 text-oat-400 hover:text-ink"><X size={24} /></button>

                            <div className="text-center mb-8">
                                <div className="w-12 h-12 bg-oat-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                                    🧴
                                </div>
                                <p className="text-xs text-oat-400">来自远方的漂流瓶</p>
                            </div>

                            <div className="bg-oat-50/50 rounded-xl p-6 mb-8 min-h-[120px] max-h-[300px] overflow-y-auto">
                                <p className="text-ink font-hand text-xl leading-relaxed whitespace-pre-wrap">
                                    {pickedBottle.content}
                                </p>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button onClick={() => { setMode(null); setPickedBottle(null); }} className="px-6 py-2 rounded-full border border-oat-200 text-oat-500 hover:bg-oat-50 hover:text-ink transition-colors">
                                    扔回海里
                                </button>
                                <Link to={`/post/${pickedBottle.id}`} className="px-6 py-2 rounded-full bg-haze-100 text-haze-700 hover:bg-haze-200 font-medium transition-colors">
                                    去回应
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast */}
                {toast && (
                    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink/80 text-white px-6 py-2 rounded-full shadow-lg backdrop-blur text-sm z-50 animate-fade-in">
                        {toast}
                    </div>
                )}

            </main>
        </div>
    );
}
