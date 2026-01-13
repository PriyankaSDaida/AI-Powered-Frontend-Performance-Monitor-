'use client';

import { useEffect } from 'react';
import { initMonitor } from '@/sdk';

export default function MonitorInit() {
    useEffect(() => {
        // In a real app, appId would come from env or config
        initMonitor({
            appId: 'self-monitor-001',
            ingestUrl: '/api/ingest',
        });
    }, []);

    return null;
}
