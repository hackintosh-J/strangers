import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, token } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || '';

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: '两次密码不一致' });
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/users/${user.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword: password })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: '密码修改成功' });
                setPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: '修改失败' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: '网络错误' });
        }
    };

    return (
        <div className="flex min-h-screen bg-paper">
            <Sidebar />
            <main className="flex-1 p-8 flex items-center justify-center">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-warm-100">
                    <h1 className="text-2xl font-bold mb-2 text-gray-800">个人资料</h1>
                    <p className="text-gray-500 mb-6">当前用户: <span className="font-semibold text-gray-800">{user.username}</span></p>

                    <div className="border-t border-gray-100 pt-6">
                        <h2 className="text-lg font-medium mb-4">修改密码</h2>
                        {message.text && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {message.text}
                            </div>
                        )}
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                                更新密码
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
