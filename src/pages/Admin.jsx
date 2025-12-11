import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Trash2, Key, User, MessageSquare } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Admin() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'users'
    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            // navigate('/');
        }
        fetchMessages();
        fetchUsers();
    }, [user]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_URL}/api/messages`);
            if (res.ok) setMessages(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(await res.json());
            } else {
                const data = await res.json();
                console.error('Fetch users failed:', data);
                alert('无法获取用户列表: ' + (data.error || res.status));
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteMessage = async (id) => {
        if (!confirm('确认删除帖子?')) return;
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

    const handleDeleteUser = async (id) => {
        if (!confirm('确认删除用户? 该用户的所有帖子和评论也将被删除！')) return;
        try {
            const res = await fetch(`${API_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
                fetchMessages(); // Refresh msg as some might be gone
            } else {
                alert('删除失败');
            }
        } catch (e) { alert('Error'); }
    };

    const handleChangePassword = async (id) => {
        const newPwd = prompt('请输入新密码:');
        if (!newPwd) return;

        try {
            const res = await fetch(`${API_URL}/api/users/${id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword: newPwd })
            });
            if (res.ok) alert('密码修改成功');
            else alert('修改失败');
        } catch (e) { alert('Error'); }
    };

    return (
        <div className="flex min-h-screen bg-paper">
            <Sidebar />
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800">管理面板</h1>

                    <div className="flex gap-4 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`pb-2 px-1 ${activeTab === 'posts' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
                        >
                            帖子管理 ({messages.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`pb-2 px-1 ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
                        >
                            用户管理 ({users.length})
                        </button>
                    </div>

                    {activeTab === 'posts' ? (
                        <div className="space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-gray-700">{msg.nickname}</span>
                                            <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2">{msg.content}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">用户</th>
                                        <th className="px-6 py-3 font-medium">角色</th>
                                        <th className="px-6 py-3 font-medium">注册时间</th>
                                        <th className="px-6 py-3 font-medium text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="px-6 py-4 font-medium text-gray-800">{u.username}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">{new Date(u.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleChangePassword(u.id)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="修改密码"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="删除用户"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
