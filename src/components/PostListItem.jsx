import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Heart, Clock } from 'lucide-react';

export default function PostListItem({ post }) {
    // Format relative time helper could be added, using localeString for now
    return (
        <Link to={`/post/${post.id}`} className="block group">
            <div className="flex items-start gap-4 p-5 hover:bg-warm-50/50 rounded-xl transition-all border-b border-warm-50 hover:border-transparent">
                {/* Minimal Meta Left */}
                <div className="hidden sm:flex flex-col items-center gap-1 min-w-[50px] text-warm-300 pt-1">
                    <span className="text-lg font-medium text-warm-400">{post.like_count || 0}</span>
                    <Heart size={14} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-warm-400 px-2 py-0.5 bg-warm-50 rounded-full border border-warm-100">
                            {post.nickname || '路人'}
                        </span>
                        <span className="text-xs text-warm-300 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(post.created_at * 1000).toLocaleString()}
                        </span>
                    </div>

                    {post.title && (
                        <h3 className="text-lg font-serif font-bold text-ink mb-1 group-hover:text-warm-700 transition-colors line-clamp-1">
                            {post.title}
                        </h3>
                    )}

                    <p className="text-pencil line-clamp-2 text-sm leading-relaxed">
                        {post.summary}
                    </p>
                </div>

                {/* Comments Count Right */}
                <div className="flex items-center gap-1 text-warm-300 text-sm">
                    <MessageSquare size={16} />
                    <span>{post.comment_count || 0}</span>
                </div>
            </div>
        </Link>
    );
}
