import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-tr from-orange-100/40 to-rose-100/40 rounded-full blur-[60px]" />

            <nav className="p-6 relative z-10">
                <span className="font-serif text-2xl font-bold tracking-tight text-slate-800">Strangers.</span>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
                <div className="max-w-2xl space-y-8 animate-fade-in-up">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center mx-auto mb-8 rotate-3">
                        <Sparkles className="text-amber-400" size={32} />
                    </div>

                    <h1 className="font-serif text-5xl md:text-7xl font-medium text-slate-900 leading-[1.1]">
                        在这里，<br />
                        做回<span className="italic text-slate-400">真实</span>的自己。
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 font-sans leading-relaxed max-w-lg mx-auto">
                        一个安静的角落，没有熟人，只有共鸣。<br />
                        向树洞倾诉，与 Echo 对话，捡起远方的漂流瓶。
                    </p>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/login?register=true"
                            className="group relative px-8 py-4 bg-slate-900 text-white rounded-full font-medium text-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                开始旅程 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-700 transition-colors" />
                        </Link>

                        <Link
                            to="/login"
                            className="px-8 py-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all font-medium"
                        >
                            已有账号
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="p-6 text-center text-slate-300 text-sm relative z-10">
                © 2024 The Strangers Project.
            </footer>
        </div>
    );
}
