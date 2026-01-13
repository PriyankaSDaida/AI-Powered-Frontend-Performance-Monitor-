import { NextRequest, NextResponse } from 'next/server';
import { generateErrorInsight } from '@/services/ai-analysis';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { error } = body;

        if (!error) {
            return NextResponse.json({ error: 'Missing error data' }, { status: 400 });
        }

        const insight = await generateErrorInsight(error);
        return NextResponse.json({ insight });

    } catch (err: any) {
        console.error('Analysis API Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
