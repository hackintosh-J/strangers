import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

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
        const action = isRegister ? register : login;

        // For register, we now use the real API
        const res = await action(username, password);

        if (res.success) {
            if (isRegister) await login(username, password); // Auto login
            navigate('/');
        } else {
            setError(res.error || '操作失败');
        }
    };

    return (
        <div className="flex min-h-screen bg-paper">
            <Sidebar />
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 card bg-white/80 backdrop-blur-sm border-warm-100 shadow-xl">
                    <h2 className="text-3xl font-serif font-bold mb-8 text-center text-ink tracking-wide">
                        {isRegister ? '加入我们' : '欢迎回家'}
                    </h2>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-sans flex items-center justify-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-pencil mb-2 font-sans">用户名</label>
                            <input
                                type="text"
                                className="input-warm"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-pencil mb-2 font-sans">密码</label>
                            <input
                                type="password"
                                className="input-warm"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-warm-600 text-white rounded-xl font-medium hover:bg-warm-700 transition-all shadow-md hover:shadow-lg active:scale-95 font-sans"
                        >
                            {isRegister ? '注册并登录' : '登录'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-sm text-warm-500 hover:text-warm-700 underline underline-offset-4 decoration-warm-200 transition-all font-sans"
                        >
                            {isRegister ? '已有账号？去登录' : '还没有账号？去注册'}
                        </button>
                    </div>
            </main>
        </div>
    );
}
