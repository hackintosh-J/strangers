import React, { useState, useEffect } from 'react';
import { Smile, Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function StickerPicker({ onSelect, onClose }) {
    const { token } = useAuth();
    const [stickers, setStickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        fetchStickers();
    }, []);

    const fetchStickers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/stickers/mine`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setStickers(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. Upload to R2
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url } = await uploadRes.json();

            // 2. Register Sticker in DB
            const stickerRes = await fetch(`${API_URL}/api/stickers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (stickerRes.ok) {
                fetchStickers(); // Refresh
            }
        } catch (err) {
            alert('Failed to add sticker: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('删除此表情？')) return;
        try {
            await fetch(`${API_URL}/api/stickers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchStickers();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="absolute bottom-16 right-4 w-72 h-80 bg-white rounded-2xl shadow-xl border border-oat-200 flex flex-col z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-oat-100 bg-oat-50 rounded-t-2xl">
                <span className="text-sm font-bold text-ink flex items-center gap-2">
                    <Smile size={16} /> 我的表情
                </span>
                <button onClick={onClose} className="p-1 hover:bg-oat-200 rounded-full text-oat-400">
                    <X size={16} />
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 gap-2 content-start">
                {/* Add Button */}
                <label className={`aspect-square rounded-xl border-2 border-dashed border-oat-200 flex items-center justify-center cursor-pointer hover:border-haze-400 hover:bg-haze-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    {uploading ? <div className="animate-spin w-4 h-4 border-2 border-haze-400 border-t-transparent rounded-full" /> : <Plus size={20} className="text-oat-400" />}
                </label>

                {/* System/User Stickers */}
                {stickers.map(s => (
                    <button
                        key={s.id}
                        onClick={() => onSelect(s)}
                        className="aspect-square rounded-xl p-1 hover:bg-oat-100 transition-colors relative group"
                    >
                        <img src={s.url} alt="sticker" className="w-full h-full object-contain" />
                        <div
                            onClick={(e) => handleDelete(e, s.id)}
                            className="absolute top-0 right-0 p-1 bg-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 shadow-sm"
                        >
                            <Trash2 size={14} />
                        </div>
                    </button>
                ))}
            </div>

            {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/80"><div className="animate-spin text-haze-400">...</div></div>}
        </div>
    );
}
