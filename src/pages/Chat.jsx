import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { Send, ArrowLeft, Loader2, RefreshCw, Mic, Smile, ImageIcon } from 'lucide-react';
import StickerPicker from '../components/StickerPicker';

export default function Chat() {
    const { id } = useParams();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [targetUser, setTargetUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showStickers, setShowStickers] = useState(false);
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        if (!token) return;

        // Fetch Partner Info
        fetch(`${API_URL}/api/users/${id}/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setTargetUser(data))
            .catch(console.error);
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [id, token]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_URL}/api/direct_messages/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Backend returns array directly
                setMessages(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (content = input, type = 'text') => {
        if (!content.trim() && type === 'text') return;
        setSending(true);
        try {
            const res = await fetch(`${API_URL}/api/direct_messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ receiver_id: id, content, type }) // Fixed userId -> id
                // Note: type is implicit in content or need schema update? Schema v4 checks? 
                // Ah, current schema doesn't have 'type'. We usually store JSON or prefix.
                // Let's use prefix for simplicity: [image]url, [voice]url, [sticker]url
                // Backend V4 schema: content TEXT.
            });

            if (res.ok) {
                setInput('');
                fetchMessages();
                setShowStickers(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    // Prefixes for mixed content types in V4 schema
    const formatPayload = (url, type) => `[${type}]${url}`;

    const onStickerSelect = (sticker) => handleSend(formatPayload(sticker.url, 'sticker'), 'sticker');

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Quick upload logic
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const { url } = await res.json();
                handleSend(formatPayload(url, 'image'));
            } else {
                const err = await res.json();
                alert(err.error || 'Upload failed');
            }
        } catch (e) { alert('Upload error: ' + e.message); }
    };

    const toggleRecord = async () => {
        if (recording) {
            mediaRecorder.stop();
            setRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                const chunks = [];
                recorder.ondataavailable = e => chunks.push(e.data);
                recorder.onstop = async () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
                    // Upload
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch(`${API_URL}/api/upload`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                    if (res.ok) {
                        const { url } = await res.json();
                        handleSend(formatPayload(url, 'voice'));
                    }
                };
                recorder.start();
                setMediaRecorder(recorder);
                setRecording(true);
            } catch (e) { alert('Mic access denied'); }
        }
    };

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null);

    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        // Only for stickers sent by OTHERS
        if (String(msg.sender_id) === String(user.id)) return;

        let url = null;
        if (msg.content.startsWith('[sticker]')) {
            url = msg.content.replace('[sticker]', '');
        }

        if (url) {
            setContextMenu({ x: e.clientX, y: e.clientY, url, msgId: msg.id, isMyMsg: String(msg.sender_id) === String(user.id), type: 'sticker', content: msg.created_at });
        } else {
            // Generic context menu for recall (text/image/voice)
            if (String(msg.sender_id) === String(user.id)) {
                setContextMenu({ x: e.clientX, y: e.clientY, msgId: msg.id, isMyMsg: true, content: msg.created_at, type: 'other' });
            }
        }
    };

    const saveSticker = async () => {
        if (!contextMenu) return;
        try {
            const res = await fetch(`${API_URL}/api/stickers/collect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url: contextMenu.url })
            });
            if (res.ok) alert('已收藏表情');
        } catch (e) { console.error(e); }
        setContextMenu(null);
    };

    const handleRecall = async () => {
        if (!contextMenu || !contextMenu.msgId) return;
        try {
            const res = await fetch(`${API_URL}/api/direct_messages/${contextMenu.msgId}/revoke`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Remove locally
                setMessages(prev => prev.filter(m => m.id !== contextMenu.msgId));
            } else {
                const err = await res.json();
                alert(err.error || '撤回失败');
            }
        } catch (e) { alert('撤回出错'); }
        setContextMenu(null);
    };

    // Close menu on click elsewhere
    useEffect(() => {
        const h = () => setContextMenu(null);
        window.addEventListener('click', h);
        return () => window.removeEventListener('click', h);
    }, []);

    const renderMessage = (msg) => {
        const isMe = String(msg.sender_id) === String(user.id);
        let content = msg.content;
        let type = 'text';

        // Parse legacy prefix
        if (content.startsWith('[image]')) { type = 'image'; content = content.replace('[image]', ''); }
        else if (content.startsWith('[sticker]')) { type = 'sticker'; content = content.replace('[sticker]', ''); }
        else if (content.startsWith('[voice]')) { type = 'voice'; content = content.replace('[voice]', ''); }

        return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                <div
                    onContextMenu={(e) => handleContextMenu(e, msg)}
                    className={`max-w-[75%] rounded-2xl p-4 shadow-sm relative ${isMe ? 'bg-haze-600 text-white rounded-br-none' : 'bg-white text-ink border border-oat-200 rounded-bl-none'}`}
                >
                    {type === 'text' && <p>{content}</p>}
                    {type === 'image' && <img src={content} alt="img" className="rounded-lg max-h-60 cursor-pointer" onClick={() => window.open(content)} />}
                    {type === 'sticker' && <img src={content} alt="sticker" className="w-32 h-32 object-contain" />}
                    {type === 'voice' && (
                        <div className="flex items-center gap-2">
                            <Mic size={16} />
                            {/* Quick audio player */}
                            <audio controls src={content} className="h-8 w-48" />
                        </div>
                    )}
                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-haze-200' : 'text-oat-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="text-center p-10">Loading...</div>;

    return (
        <div className="flex flex-col h-screen bg-oat-50">
            {/* Header */}
            <div className="bg-white border-b border-oat-200 px-4 py-3 flex items-center gap-3 shadow-sm z-10">
                <Link to="/friends" className="p-2 hover:bg-oat-100 rounded-full text-oat-500"><ArrowLeft size={20} /></Link>
                <div className="w-10 h-10 rounded-full bg-haze-100 flex items-center justify-center text-haze-600 font-bold border border-oat-200">
                    {targetUser?.username?.[0].toUpperCase()}
                </div>
                <div className="flex-1">
                    <h2 className="font-bold text-ink text-lg">{targetUser?.username || 'Chat'}</h2>
                    {targetUser?.last_active_at && (Date.now() / 1000 - targetUser.last_active_at < 300) &&
                        <span className="text-xs text-green-500 font-medium flex items-center gap-1">● 在线</span>
                    }
                </div>
                <button onClick={fetchMessages} className="p-2 text-oat-400 hover:text-haze-500 transition-colors"><RefreshCw size={20} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 relative">
                {messages.map(renderMessage)}
                <div ref={scrollRef} />

                {contextMenu && (
                    <div
                        className="fixed bg-white shadow-xl rounded-lg border border-oat-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button onClick={saveSticker} className={`w-full text-left px-4 py-2 hover:bg-oat-100 text-sm text-ink ${!contextMenu.url ? 'hidden' : ''}`}>
                            收藏表情
                        </button>
                        {contextMenu.isMyMsg && (
                            <button onClick={handleRecall} className="w-full text-left px-4 py-2 hover:bg-oat-100 text-sm text-red-500">
                                撤回
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="bg-white border-t border-oat-200 p-4 safe-area-pb relative">
                {showStickers && <StickerPicker onSelect={onStickerSelect} onClose={() => setShowStickers(false)} />}

                <div className="max-w-4xl mx-auto flex items-end gap-2 bg-oat-50 p-2 rounded-2xl border border-oat-200 focus-within:border-haze-300 focus-within:ring-2 focus-within:ring-haze-100 transition-all">
                    {/* Media Actions */}
                    <button onClick={() => setShowStickers(!showStickers)} className="p-2 text-oat-400 hover:text-haze-500 hover:bg-white rounded-xl transition-all">
                        <Smile size={24} />
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="p-2 text-oat-400 hover:text-haze-500 hover:bg-white rounded-xl transition-all">
                        <ImageIcon size={24} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                    <div className="flex-1 min-h-[44px] flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="说点什么..."
                            className="w-full bg-transparent border-none focus:ring-0 text-ink placeholder:text-oat-400 px-2"
                        />
                    </div>

                    <button
                        onClick={toggleRecord}
                        className={`p-2 rounded-xl transition-all ${recording ? 'bg-red-500 text-white animate-pulse' : 'text-oat-400 hover:text-haze-500 hover:bg-white'}`}
                    >
                        <Mic size={24} />
                    </button>

                    <button
                        onClick={() => handleSend()}
                        disabled={sending || (!input.trim() && !recording)}
                        className="p-2 bg-haze-600 text-white rounded-xl hover:bg-haze-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
