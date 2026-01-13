'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Filter, X } from 'lucide-react';

export default function DashboardFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [userId, setUserId] = useState(searchParams.get('userId') || '');
    const [hasReplay, setHasReplay] = useState(searchParams.get('hasReplay') === 'true');

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams);

        if (userId) params.set('userId', userId);
        else params.delete('userId');

        if (hasReplay) params.set('hasReplay', 'true');
        else params.delete('hasReplay');

        router.push(`?${params.toString()}`);
    }, [userId, hasReplay, router, searchParams]);

    const clearFilters = () => {
        setUserId('');
        setHasReplay(false);
        router.push('/dashboard');
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Filter by User ID</label>
                <input
                    type="text"
                    placeholder="e.g. user-123"
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-48"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                />
            </div>

            <div className="flex items-center pb-2">
                <input
                    id="hasReplay"
                    type="checkbox"
                    className="mr-2 h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    checked={hasReplay}
                    onChange={(e) => setHasReplay(e.target.checked)}
                />
                <label htmlFor="hasReplay" className="text-sm text-gray-700 select-none cursor-pointer">
                    Has Session Replay
                </label>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={applyFilters}
                    className="flex items-center gap-1 bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition-colors"
                >
                    <Filter className="w-4 h-4" />
                    Apply
                </button>
                {(userId || hasReplay) && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 bg-gray-100 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}
