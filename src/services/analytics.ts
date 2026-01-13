import db from '@/lib/db';
import { symbolicateStackTrace } from '@/lib/symbolicator';

export interface VitalMetric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta?: number;
}

export type Period = '1h' | '24h' | '7d';

function getTimeRange(period: Period): number {
    const now = Date.now();
    switch (period) {
        case '1h': return now - 60 * 60 * 1000;
        case '24h': return now - 24 * 60 * 60 * 1000;
        case '7d': return now - 7 * 24 * 60 * 60 * 1000;
        default: return now - 24 * 60 * 60 * 1000;
    }
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    // Thresholds based on Web Vitals
    if (name === 'LCP') return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    if (name === 'CLS') return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    if (name === 'INP') return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    if (name === 'TTFB') return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    return 'good';
}

export async function getDashboardStats(appId: string, period: Period = '24h') {
    const since = getTimeRange(period);

    // Vitals: Get P75 for each metric
    const vitalsStmt = db.prepare(`
    SELECT payload 
    FROM events 
    WHERE appId = ? AND type = 'vital' AND timestamp > ?
  `);

    const vitalRows = vitalsStmt.all(appId, since) as any[];

    const aggregatedVitals: Record<string, number[]> = {
        LCP: [], CLS: [], INP: [], TTFB: []
    };

    vitalRows.forEach(row => {
        const p = JSON.parse(row.payload);
        if (aggregatedVitals[p.name]) {
            aggregatedVitals[p.name].push(p.value);
        }
    });

    const vitals = Object.entries(aggregatedVitals).map(([name, values]) => {
        if (values.length === 0) return { name, value: 0, rating: 'good' } as VitalMetric;

        // Sort and pick P75
        values.sort((a, b) => a - b);
        const p75Index = Math.floor(values.length * 0.75);
        const value = values[p75Index];

        return {
            name,
            value: Math.round(value * 100) / 100, // round to 2 decimals
            rating: getRating(name, value)
        } as VitalMetric;
    });

    // Error Count
    const errorStmt = db.prepare(`
    SELECT count(*) as count 
    FROM events 
    WHERE appId = ? AND type = 'error' AND timestamp > ?
  `);
    const errorCount = (errorStmt.get(appId, since) as any).count;

    // Recent Errors (List)
    const recentErrorsStmt = db.prepare(`
    SELECT payload, timestamp 
    FROM events 
    WHERE appId = ? AND type = 'error' AND timestamp > ? 
    ORDER BY timestamp DESC 
    LIMIT 10
  `);
    const recentErrorsRaw = (recentErrorsStmt.all(appId, since) as any[]).map(row => ({
        ...JSON.parse(row.payload),
        timestamp: row.timestamp
    }));

    // Symbolicate errors if map file exists
    // Note: In real world, we need 'release' from the event payload.
    // We'll assume a default or check if event has release.
    const recentErrors = await Promise.all(recentErrorsRaw.map(async (err: any) => {
        if (err.stack) {
            // For MVP, assuming a fixed release or extracting from payload if available.
            // If the user didn't send release, symbolication might fail or use latest.
            const release = err.release || '1.0.0'; // Fallback
            const newStack = await symbolicateStackTrace(err.stack, release);
            return { ...err, stack: newStack };
        }
        return err;
    }));

    return {
        vitals,
        errorCount,
        recentErrors
    };
}

export async function getEventTimeSeries(appId: string, period: Period = '24h') {
    // Construct simplified time buckets for charts
    const since = getTimeRange(period);

    // Group by hour (or minute depending on range)
    // SQLite doesn't have great date functions by default compared to other DBs, doing simple JS mapping for MVP
    const eventsStmt = db.prepare(`
        SELECT timestamp, type 
        FROM events 
        WHERE appId = ? AND timestamp > ?
    `);
    const rows = eventsStmt.all(appId, since) as any[];

    // Bucket by hour
    const buckets: Record<string, { vitals: number, errors: number, time: number }> = {};

    rows.forEach(row => {
        const date = new Date(row.timestamp);
        date.setMinutes(0, 0, 0); // round to hour
        const key = date.toISOString();

        if (!buckets[key]) {
            buckets[key] = { vitals: 0, errors: 0, time: date.getTime() };
        }

        if (row.type === 'vital') buckets[key].vitals++;
        if (row.type === 'error') buckets[key].errors++;
    });

    return Object.values(buckets).sort((a, b) => a.time - b.time);
}

export async function getDemographics(appId: string, period: Period = '24h') {
    const since = getTimeRange(period);

    // Top Browsers
    const browserStmt = db.prepare(`
        SELECT payload
        FROM events
        WHERE appId = ? AND timestamp > ?
    `);

    const rows = browserStmt.all(appId, since) as any[];

    const browsers: Record<string, number> = {};
    const countries: Record<string, number> = {};

    rows.forEach(row => {
        const p = JSON.parse(row.payload);

        // Count Browser
        const b = p.device?.browser || 'Unknown';
        browsers[b] = (browsers[b] || 0) + 1;

        // Count Country
        const c = p.geo?.country || 'Unknown';
        countries[c] = (countries[c] || 0) + 1;
    });

    return {
        browsers: Object.entries(browsers).map(([name, count]) => ({ name, value: count })).sort((a, b) => b.value - a.value),
        countries: Object.entries(countries).map(([name, count]) => ({ name, value: count })).sort((a, b) => b.value - a.value)
    };
}
