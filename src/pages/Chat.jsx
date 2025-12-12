import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';

export default function Chat() {
    const { id } = useParams();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [partner, setPartner] = useState(null);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        if (!token) return;

        // Fetch Partner Info
        fetch(`${API_URL}/api/users/${id}/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setPartner(data.user || { username: 'Unknown' }));

        // Fetch Messages
        fetch(`${API_URL}/api/direct_messages/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMessages(data);
                setLoading(false);
                setTimeout(scrollToBottom, 100);
            });

        // Polling for new messages (Simple implementation)
        const interval = setInterval(() => {
            fetch(`${API_URL}/api/direct_messages/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setMessages(data);
                });
        }, 10000);

        return () => clearInterval(interval);

    }, [id, token]);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const tempMsg = {
            id: 'temp-' + Date.now(),
            sender_id: user.id,
            content: input,
            created_at: Date.now() / 1000 // optimistic
        };
        setMessages([...messages, tempMsg]);
        setInput('');
        scrollToBottom();

        try {
            await fetch(`${API_URL}/api/direct_messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ receiver_id: id, content: tempMsg.content })
            });
            // Refresh logic will catch up
        } catch (e) {
            alert('发送失败');
        }
    };

    if (!user) { navigate('/login'); return null; }

    return (
        <div className="flex min-h-screen bg-paper">
            <Sidebar />
            <main className="flex-1 w-full max-w-3xl mx-auto flex flex-col h-screen md:border-x border-oat-200 bg-white shadow-soft relative">

                {/* Header */}
                <div className="p-4 border-b border-oat-200 flex items-center gap-4 bg-white/95 backdrop-blur z-10 sticky top-0">
                    <button onClick={() => navigate('/friends')} className="md:hidden text-oat-500">
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 className="font-bold text-ink text-lg">{partner ? partner.username : 'Loading...'}</h1>
                        <p className="text-xs text-oat-400 font-serif italic">私信聊天中</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 md:pb-4 scrollbar-hide">
                    {loading ? (
                        <div className="text-center py-10"><Loader2 className="animate-spin text-oat-300 mx-auto" /></div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = String(msg.sender_id) === String(user.id);
                            return (
                                <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                                        ${isMe
                                            ? 'bg-ink text-white rounded-br-none'
                                            : 'bg-oat-100 text-ink rounded-bl-none'
                                        }
                                    `}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-oat-200 bg-white sticky bottom-0 md:static pb-20 md:pb-4">
                    <div className="relative">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="发送私信..."
                            className="w-full pl-6 pr-14 py-4 rounded-full bg-oat-50 focus:bg-white border border-transparent focus:border-oat-300 outline-none transition-all shadow-inner"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-haze-600 rounded-full flex items-center justify-center text-white hover:bg-haze-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
}
