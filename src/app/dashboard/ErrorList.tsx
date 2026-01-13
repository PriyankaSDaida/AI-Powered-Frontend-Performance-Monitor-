'use client';

import { useState } from 'react';
import { Clock, PlayCircle, X, Sparkles, Loader2 } from 'lucide-react';
import ReplayPlayer from '@/components/ReplayPlayer';
import ReactMarkdown from 'react-markdown';

export default function ErrorList({ errors }: { errors: any[] }) {
    const [replayData, setReplayData] = useState<any[] | null>(null);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [insights, setInsights] = useState<Record<string, string>>({});

    const handleAnalyze = async (error: any, index: number) => {
        const id = error.id || index.toString();
        if (insights[id]) return; // Already analyzed

        setAnalyzingId(id);
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error })
            });
            const data = await res.json();
            setInsights(prev => ({ ...prev, [id]: data.insight || 'Failed to generate insight.' }));
        } catch (e) {
            console.error(e);
            setInsights(prev => ({ ...prev, [id]: 'Error contacting AI service.' }));
        } finally {
            setAnalyzingId(null);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800">Recent Errors</h3>
                <span className="text-sm text-gray-500">Total: {errors.length}</span>
            </div>

            <div className="divide-y divide-gray-100">
                {errors.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No errors recorded recently.</div>
                ) : (
                    errors.map((err: any, i: number) => (
                        <div key={i} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="text-red-700 font-medium break-all">{err.message || 'Unknown Error'}</div>
                                <div className="flex items-center text-xs text-gray-400 whitespace-nowrap ml-4">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(err.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                            {err.stack && (
                                <pre className="mt-2 text-xs text-gray-500 overflow-x-auto p-2 bg-gray-100 rounded">
                                    {err.stack.split('\n')[0]}...
                                </pre>
                            )}
                            <div className="mt-2 flex gap-2 items-center">
                                {err.filename && <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{err.filename}</span>}
                                {err.type && <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100">{err.type}</span>}

                                {err.replayEvents && err.replayEvents.length > 0 && (
                                    <button
                                        onClick={() => setReplayData(err.replayEvents)}
                                        className="ml-auto flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                                    >
                                        <PlayCircle className="w-3 h-3" />
                                        Play Session
                                    </button>
                                )}

                                <button
                                    onClick={() => handleAnalyze(err, i)}
                                    disabled={!!analyzingId}
                                    className={`flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors disabled:opacity-50 ${(!err.replayEvents || err.replayEvents.length === 0) ? 'ml-auto' : ''}`}
                                >
                                    {analyzingId === (err.id || i.toString()) ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-3 h-3" />
                                    )}
                                    Analyze with AI
                                </button>
                            </div>

                            {insights[err.id || i.toString()] && (
                                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 text-sm text-gray-800 prose prose-purple max-w-none">
                                    <div className="flex items-center gap-2 mb-2 font-semibold text-purple-800">
                                        <Sparkles className="w-4 h-4" />
                                        AI Insight
                                    </div>
                                    <ReactMarkdown>{insights[err.id || i.toString()]}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Replay Modal Overlay */}
            {
                replayData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-semibold text-lg">Session Replay</h3>
                                <button onClick={() => setReplayData(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 bg-gray-50 flex-1 overflow-auto flex justify-center">
                                <ReplayPlayer events={replayData} />
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
