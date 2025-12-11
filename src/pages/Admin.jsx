import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            // Very basic protection, real protection is on API
            // navigate('/');
        }
        fetchMessages();
    }, [user]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_URL}/api/messages`);
            if (res.ok) setMessages(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!confirm('确认删除?')) return;
        try {
            const res = await fetch(`${API_URL}/api/messages/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                setMessages(messages.filter(m => m.id !== id));
            } else {
                alert('删除失败: 无权限');
            }
        } catch (e) { alert('Error'); }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-2xl font-bold mb-6">管理面板</h1>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-sm font-medium text-gray-500">ID</th>
                                <th className="p-4 text-sm font-medium text-gray-500">内容</th>
                                <th className="p-4 text-sm font-medium text-gray-500">作者</th>
                                <th className="p-4 text-sm font-medium text-gray-500">时间</th>
                                <th className="p-4 text-sm font-medium text-gray-500">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {messages.map(msg => (
                                <tr key={msg.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-sm text-gray-400">#{msg.id}</td>
                                    <td className="p-4 text-sm text-gray-800 max-w-xs truncate" title={msg.content}>{msg.content}</td>
                                    <td className="p-4 text-sm text-gray-600">{msg.nickname || 'Anonymous'}</td>
                                    <td className="p-4 text-sm text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleDelete(msg.id)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {messages.length === 0 && <div className="p-8 text-center text-gray-400">暂无内容</div>}
                </div>
            </div>
        </div>
    );
}
