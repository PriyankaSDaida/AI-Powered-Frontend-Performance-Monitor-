import { IEvent } from '@/lib/db';

const WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

// Simple in-memory deduplication to avoid spamming the webhook channel.
// We track unique errors by a fingerprint and enforce a hard window rate limit.
const sentAlerts = new Set<string>();
const ERROR_RATE_WINDOW = 60 * 1000; // 1 minute window
let errorCountLastWindow = 0;
let lastWindowStart = Date.now();

export async function checkAlertCondition(event: any) {
    if (!WEBHOOK_URL) return;

    // Reset rate limit window
    const now = Date.now();
    if (now - lastWindowStart > ERROR_RATE_WINDOW) {
        lastWindowStart = now;
        errorCountLastWindow = 0;
    }

    if (event.type === 'error') {
        errorCountLastWindow++;

        // Condition 1: High Error Rate
        if (errorCountLastWindow === 10) {
            await sendWebhookNotification(`🚨 **High Error Rate Alert**: 10 errors detected in the last minute.`);
        }

        // Condition 2: New Unique Error (deduplicated by message)
        // A naive unique check: message + type
        const fingerprint = `${event.payload.type}:${event.payload.message}`;
        if (!sentAlerts.has(fingerprint)) {
            sentAlerts.add(fingerprint);

            // Cleanup cache periodically if needed, but for MVP let it grow (restart clears it)
            // Or limit set size
            if (sentAlerts.size > 1000) sentAlerts.clear();

            const md = `
🔥 **New Error Detected**
**Type**: ${event.payload.type}
**Message**: ${event.payload.message}
**Browser**: ${event.payload.device?.browser || 'Unknown'}
**Link**: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard
            `.trim();

            await sendWebhookNotification(md);
        }
    }
}

async function sendWebhookNotification(text: string) {
    try {
        await fetch(WEBHOOK_URL!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: text, // Discord/Slack style
                username: "AI Frontend Monitor"
            })
        });
    } catch (err) {
        console.error('Failed to send webhook alert', err);
    }
}
