import { NextRequest, NextResponse } from 'next/server';
import { saveEvent } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.appId || !body.events || !Array.isArray(body.events)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const { appId, events, commonMetadata } = body;

        // Parse User Agent
        // @ts-ignore
        const uaParser = new UAParser(commonMetadata?.userAgent || request.headers.get('user-agent') || '');
        const device = uaParser.getResult();

        // Detect Geo
        let ip = request.headers.get('x-forwarded-for') || (request as any).ip || '127.0.0.1';
        if (ip.includes(',')) ip = ip.split(',')[0];
        const geo = geoip.lookup(ip);

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
                    ...eventData,
                    device: {
                        browser: device.browser.name,
                        os: device.os.name,
                        type: device.device.type || 'desktop'
                    },
                    geo: {
                        country: geo?.country || 'Unknown',
                        city: geo?.city || 'Unknown'
                    }
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
