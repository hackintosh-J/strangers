import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isRegister) {
                const res = await register(username, password);
                if (res.success) {
                    // Auto login after register
                    await login(username, password);
                    navigate('/');
                } else {
                    setError(res.error || '注册失败');
                }
            } else {
                const res = await login(username, password);
                if (res.success) {
                    navigate('/');
                } else {
                    setError(res.error || '登录失败');
                }
            }
        } catch (e) {
            setError('发生未知错误');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <Navbar />
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    {isRegister ? '加入 Strangers' : '欢迎回来'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        {isRegister ? '注册并登录' : '登录'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
                    </button>
                </div>
            </div>
        </div>
    );
}
