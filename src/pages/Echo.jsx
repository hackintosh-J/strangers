import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar';
import { Send, Zap, BookOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Echo() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '你好。我是 Echo。每个人都是一座孤岛，但在这里，你不需要独自承受海浪。今晚有什么心事吗？' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const messagesEndRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Prepare messages for API (exclude local-only fields if any)
            const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (!response.ok) throw new Error('Failed to connect to Echo');

            // Handle Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Add placeholder for assistant response
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // Zhipu SSE format usually: data: {...}
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        if (jsonStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(jsonStr);
                            const delta = data.choices[0].delta.content || '';

                            setMessages(prev => {
                                const newMsgs = [...prev];
                                const lastMsg = newMsgs[newMsgs.length - 1];
                                lastMsg.content += delta;
                                return newMsgs;
                            });
                        } catch (e) {
                            console.error('Error parsing SSE:', e);
                        }
                    }
                }
            }

        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: '（Echo 似乎正在思考，连接断开了...）' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (summarizing) return;
        setSummarizing(true);
        try {
            const apiMessages = messages.filter(m => m.role !== 'system'); // Send full context

            const res = await fetch(`${API_URL}/api/ai/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (res.ok) {
                const data = await res.json();
                // Auto-post to 'stories' or 'hollow' based on content? Default to Hollow for now, or let user edit.
                // For Version 1, let's auto-post to a special "Echo" channel or just Tree Hollow

                // Let's redirect user to Channel Feed (Hollow) with pre-filled state? 
                // Or actually Post it directly and go to detail?
                // User request: "can publish a summary". Let's post it directly for seamless magic.

                const postRes = await fetch(`${API_URL}/api/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: data.title,
                        content: data.content,
                        channel_slug: 'stories', // Echo stories feel like stories
                        nickname: user?.username // Or 'Echo & Me'
                    })
                });

                if (postRes.ok) {
                    const postData = await postRes.json();
                    navigate(`/post/${postData.id}`);
                }
            }
        } catch (e) {
            alert('生成失败，请重试');
        } finally {
            setSummarizing(false);
        }
    };

    return (
        <div className="flex h-screen bg-oat-50">
            <Sidebar />
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white shadow-soft h-full">
                {/* Header */}
                <div className="p-4 border-b border-oat-200 flex justify-between items-center bg-white/95 backdrop-blur z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-haze-100 flex items-center justify-center text-haze-600">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="font-serif font-bold text-ink text-lg">Echo</h1>
                            <p className="text-xs text-oat-400">随时在线的灵魂伴侣</p>
                        </div>
                    </div>

                    {messages.length > 2 && (
                        <button
                            onClick={handleSummarize}
                            disabled={summarizing || loading}
                            className="btn-ghost flex items-center gap-2 text-sm bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 px-4 py-2 rounded-full transition-colors"
                        >
                            {summarizing ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                            <span>生成心事卡片</span>
                        </button>
                    )}
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[85%] md:max-w-[70%] rounded-2xl p-4 text-sm md:text-base leading-relaxed animate-fade-in
                                ${msg.role === 'user'
                                    ? 'bg-haze-500 text-white rounded-tr-none shadow-md'
                                    : 'bg-oat-100 text-ink rounded-tl-none'
                                }
                            `}>
                                {/* Render newlines */}
                                {msg.content.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i !== msg.content.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-oat-200">
                    <div className="relative flex items-center gap-2">
                        <input
                            className="input-morandi pr-12"
                            placeholder="说点什么..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !loading && handleSend()}
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 p-2 bg-haze-500 text-white rounded-lg hover:bg-haze-600 disabled:opacity-50 disabled:bg-oat-300 transition-all"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-oat-300 mt-2">
                        Echo 由 AI 驱动，内容仅供参考。
                    </p>
                </div>
            </main>
        </div>
    );
}
