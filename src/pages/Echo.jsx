import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar';
import { Send, Zap, BookOpen, Loader2, ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/compress';

export default function Echo() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [attachment, setAttachment] = useState(null);

    // Greeting Logic
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        let greet = '你好';
        if (hour < 6) greet = '凌晨了，还不睡吗？';
        else if (hour < 9) greet = '早安，今天会是温柔的一天吗？';
        else if (hour < 12) greet = '上午好。';
        else if (hour < 18) greet = '下午好，累了吗？';
        else if (hour < 22) greet = '晚上好。';
        else greet = '夜深了，欢迎来到避风港。';

        setGreeting(greet);

        if (messages.length === 0) {
            setMessages([{ role: 'assistant', content: `${greet} 我是 Echo。想聊聊吗？` }]);
        }
    }, []); // Run once on mount

    const QUICK_REPLIES = [
        "心情不好，求安慰",
        "感觉很迷茫，不知道该怎么办",
        "今天发生了一件开心的事！",
        "只是想找个人说说话",
        "我很孤独"
    ];

    const handleQuickReply = (text) => {
        setInput(text);
        // Optional: auto send? Let's just fill input for user to edit/confirm
        // Or auto-send for smoother exp:
        // handleSend(text); // Need to refactor handleSend to accept arg
    };

    const API_URL = import.meta.env.VITE_API_URL || '';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (textOverride = null) => {
        const isString = typeof textOverride === 'string';
        const textToSend = isString ? textOverride : input;

        // Check text OR attachment
        if ((!textToSend.trim() && !attachment) || loading) return;

        // Construct Content
        let finalContent = textToSend;
        if (attachment && !textOverride) {
            finalContent = `${textToSend} [image]${attachment.url}`;
        }

        const userMsg = { role: 'user', content: finalContent };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachment(null); // Clear attachment
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
            // Handle Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            // Add placeholder for assistant response
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode with stream: true to handle multi-byte characters split across chunks
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                // Keep the last potentially incomplete line in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    if (trimmedLine.startsWith('data: ')) {
                        const jsonStr = trimmedLine.slice(6);
                        if (jsonStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(jsonStr);
                            const delta = data.choices[0].delta.content || '';
                            if (delta) {
                                setMessages(prev => {
                                    // Optimization: Modify last message directly to avoid massive re-renders? 
                                    // React state immutability is safer.
                                    const newMsgs = [...prev];
                                    const lastMsg = newMsgs[newMsgs.length - 1];
                                    if (lastMsg.role === 'assistant') {
                                        lastMsg.content = (lastMsg.content + delta).trimStart();
                                    }
                                    return newMsgs;
                                });
                            }
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
            // System prompt is handled by backend, we just send context
            // Limit context to last 20 messages to avoid token overflow if chat is long
            const recentMessages = messages.slice(-20).filter(m => m.role !== 'system');

            const res = await fetch(`${API_URL}/api/ai/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ messages: recentMessages })
            });

            if (res.ok) {
                const data = await res.json();

                const postRes = await fetch(`${API_URL}/api/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: data.title,
                        content: data.content,
                        channel_slug: 'stories',
                        nickname: user?.username
                    })
                });

                if (postRes.ok) {
                    const postData = await postRes.json();
                    navigate(`/post/${postData.id}`);
                } else {
                    alert("发布摘要失败，请重试");
                }
            } else {
                alert("生成摘要失败");
            }
        } catch (e) {
            console.error(e);
            alert('生成失败，请重试');
        } finally {
            setSummarizing(false);
        }
    };

    return (
        <div className="flex h-screen bg-oat-50">
            <Sidebar />
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white shadow-soft h-full pb-20 md:pb-0">
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
                                {(() => {
                                    // Robust rendering for mixed text/image
                                    // Trim start to avoid empty first lines
                                    const parts = msg.content.trimStart().split(/(\[image\]https?:\/\/[^\s]+)/g);
                                    return parts.map((part, pIdx) => {
                                        if (part.startsWith('[image]')) {
                                            const src = part.replace('[image]', '');
                                            return <img key={pIdx} src={src} alt="content" className="rounded-lg max-h-60 my-2 block" />;
                                        }
                                        if (!part.trim()) return null;
                                        // Render Text with newlines
                                        return (
                                            <span key={pIdx}>
                                                {part.split('\n').map((line, lIdx) => (
                                                    <React.Fragment key={lIdx}>
                                                        {line}
                                                        {lIdx !== part.split('\n').length - 1 && <br />}
                                                    </React.Fragment>
                                                ))}
                                            </span>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-oat-200">
                    {messages.length < 3 && (
                        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                            {QUICK_REPLIES.map((text, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickReply(text)}
                                    className="whitespace-nowrap px-4 py-1.5 rounded-full bg-oat-100 text-oat-600 text-xs hover:bg-haze-100 hover:text-haze-600 transition-colors"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="relative flex items-center gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="echo-img-upload"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;

                                // Size check handled by compression or server, but keeping soft limit or relying on compression
                                // If compression fails or file is massive, we catch it.

                                try {
                                    setLoading(true);
                                    const compressedFile = await compressImage(file, 'ai');

                                    const formData = new FormData();
                                    formData.append('file', compressedFile);
                                    const res = await fetch(`${API_URL}/api/upload`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` },
                                        body: formData
                                    });
                                    if (res.ok) {
                                        const { url } = await res.json();
                                        setAttachment({ url, name: file.name });
                                        // clear input file value so allow same file recheck?
                                        e.target.value = '';
                                    } else {
                                        const err = await res.json();
                                        alert(err.error || '上传失败');
                                    }
                                } catch (err) {
                                    console.error(err);
                                    alert('上传失败：' + err.message);
                                }
                                finally { setLoading(false); }
                            }}
                        />
                        <label htmlFor="echo-img-upload" className="p-2 text-oat-400 hover:text-haze-500 cursor-pointer transition-colors">
                            <ImageIcon size={20} />
                        </label>

                        {/* Attachment Preview */}
                        {attachment && (
                            <div className="absolute bottom-full mb-2 left-0 bg-white p-2 rounded-lg shadow-soft border border-oat-200 flex items-center gap-2 animate-fade-in-up">
                                <div className="w-12 h-12 rounded bg-oat-100 overflow-hidden relative">
                                    <img src={attachment.url} alt="preview" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs text-oat-500 max-w-[100px] truncate">{attachment.name}</span>
                                <button
                                    onClick={() => setAttachment(null)}
                                    className="p-1 rounded-full hover:bg-rose-100 text-oat-400 hover:text-rose-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <input
                            className="input-morandi pr-12 w-full"
                            placeholder="说点什么..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !loading && handleSend()}
                            disabled={loading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={(!input.trim() && !attachment) || loading}
                            className="p-2 bg-haze-500 text-white rounded-lg hover:bg-haze-600 disabled:opacity-50 disabled:bg-oat-300 transition-all"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
                <p className="text-center text-[10px] text-oat-300 mt-2">
                    Echo 由 AI 驱动，内容仅供参考。
                </p>
            </main>
        </div>
    );
}

