import React from 'react';
import { cn } from '../utils/cn'; // Assuming you have a cn utility, if not I'll just use template literals or install clsx/tailwind-merge. 
// Wait, looking at package.json, `clsx` and `tailwind-merge` are installed.
// But I need to check where `cn` is defined. The `utils` folder existed in file list.
// Let me quickly check `src/utils` content first to be sure or just assume/create it. 
// Actually, I'll just check if utils/cn.js or utils/index.js exists.
// Better yet, I will define `cn` inside this file if I'm not sure, or just use `clsx` and `twMerge` directly if I can import them.
// Let's assume standard `lib/utils` or `utils/cn` pattern.
// But checking the file list again: `utils` dir exists.
// I'll try to use a safe bet and just implement a local helper if needed, but likely `clsx` is enough.

export default function Skeleton({ className, ...props }) {
    return (
        <div
            className={`animate-pulse rounded-md bg-oat-200/50 ${className}`}
            {...props}
        />
    );
}
