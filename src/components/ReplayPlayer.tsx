'use client';

import { useEffect, useRef } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';

interface ReplayPlayerProps {
    events: any[];
    width?: number;
    height?: number;
}

export default function ReplayPlayer({ events, width = 800, height = 400 }: ReplayPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current || !events || events.length < 2) return;

        // Clean up previous instance
        if (containerRef.current.innerHTML !== '') {
            containerRef.current.innerHTML = '';
        }

        try {
            playerRef.current = new rrwebPlayer({
                target: containerRef.current,
                props: {
                    events,
                    width,
                    height,
                    autoPlay: false,
                },
            });
        } catch (err) {
            console.error("Failed to init player", err);
        }

        return () => {
            // Cleanup provided by nuking innerHTML or letting GC handle it
            // rrweb-player doesn't expose a clean destroy() method consistently
        };
    }, [events, width, height]);

    if (!events || events.length < 2) {
        return <div className="p-4 text-gray-500">Not enough data to replay session.</div>;
    }

    return (
        <div className="border rounded shadow-sm overflow-hidden bg-gray-900">
            <div ref={containerRef} />
        </div>
    );
}
