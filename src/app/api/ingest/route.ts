import { NextRequest, NextResponse } from 'next/server';
import { saveEvent } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.appId || !body.events || !Array.isArray(body.events)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const { appId, events, commonMetadata } = body;

        // Process batch of events
        events.forEach((eventData: any) => {
            // Merge common metadata with event specific data if needed
            // For now, we assume eventData contains the core metric info

            saveEvent({
                id: uuidv4(),
                appId,
                type: eventData.type || 'unknown',
                timestamp: Date.now(), // or eventData.timestamp if trusted
                payload: {
                    ...commonMetadata,
                    ...eventData
                }
            });
        });

        return NextResponse.json({ success: true, count: events.length }, { status: 202 });

    } catch (error) {
        console.error('Ingestion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    })
}
