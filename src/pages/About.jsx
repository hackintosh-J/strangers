import React from 'react';
import Navbar from '../components/Navbar';
import { Heart } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-paper">
            <Navbar />

            <main className="max-w-2xl mx-auto px-6">
                <article className="prose prose-lg prose-p:font-serif prose-p:text-ink prose-headings:font-serif prose-headings:tracking-wide mx-auto">
                    <h1 className="text-center text-4xl mb-12 text-warm-700">初衷</h1>

                    <p>
                        这是一个用来让陌生人之间温暖互动的角落。
                    </p>

                    <p>
                        也许你也经历过这样的时刻：在一段关系结束后，发现自己很难从回忆中走出来。想要重新开始，却又害怕重蹈覆辙；心墙越筑越高，朋友却越来越少。
                    </p>

                    <p>
                        随着心境的改变，交际圈子似乎也变得越来越窄。有很多话藏在心里，不敢对身边的人说，也不想在喧嚣的社交网络上公之于众。
                    </p>

                    <p>
                        但我相信，这个世界上一定有人愿意倾听，也一定有人渴望被温暖。
                    </p>

                    <hr className="border-warm-200 my-10 w-1/2 mx-auto" />

                    <p>
                        回望我们的成长之路，或许都曾目睹过身边的朋友在痛苦中挣扎。有人在长夜里独自对抗抑郁，有人用极端的方式试图证明自己的存在，也有人用看似叛逆的外壳包裹脆弱的内心。
                    </p>

                    <p>
                        <strong>每个人都有破碎的时候，也都有需要被接住的瞬间。</strong>
                    </p>

                    <p>
                        我希望这里能成为一个避风港。在这里，我们都是陌生人，但我们不再冷漠。
                        <br />
                        基于温暖，收获温暖，传递温暖。
                    </p>

                    <div className="flex justify-center mt-16 text-warm-400">
                        <Heart size={32} className="animate-breathe" />
                    </div>
                </article>
            </main>
        </div>
    );
}
