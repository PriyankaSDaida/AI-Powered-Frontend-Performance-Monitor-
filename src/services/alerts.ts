import { IEvent } from '@/lib/db';

const WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

// Simple in-memory deduplication to avoid spamming the webhook channel.
// We track unique errors by a fingerprint and enforce a hard window rate limit.
const sentAlerts = new Set<string>();
const ERROR_RATE_WINDOW = 60 * 1000; // 1 minute window
let errorCountLastWindow = 0;
let lastWindowStart = Date.now();

// Performance Budgets
const BUDGETS: Record<string, number> = {
    LCP: 2500,
    CLS: 0.1,
    INP: 200
};

// Track last alert time for each metric to avoid spam (10 min lockout)
const lastBudgetAlerts: Record<string, number> = {};
const BUDGET_ALERT_COOLDOWN = 10 * 60 * 1000;

export async function checkAlertCondition(event: any) {
    if (!WEBHOOK_URL) return;

    // Reset rate limit window
    const now = Date.now();
    if (now - lastWindowStart > ERROR_RATE_WINDOW) {
        lastWindowStart = now;
        errorCountLastWindow = 0;
    }

    // 1. Error Alerts
    if (event.type === 'error') {
        errorCountLastWindow++;

        // Condition 1: High Error Rate
        if (errorCountLastWindow === 10) {
            await sendWebhookNotification(`🚨 **High Error Rate Alert**: 10 errors detected in the last minute.`);
        }

        // Condition 2: New Unique Error (deduplicated by message)
        const fingerprint = `${event.payload.type}:${event.payload.message}`;
        if (!sentAlerts.has(fingerprint)) {
            sentAlerts.add(fingerprint);
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

    // 2. Performance Budget Alerts
    if (event.type === 'vital') {
        const { name, value } = event.payload;
        const budget = BUDGETS[name];

        if (budget && value > budget) {
            const lastAlert = lastBudgetAlerts[name] || 0;

            if (now - lastAlert > BUDGET_ALERT_COOLDOWN) {
                lastBudgetAlerts[name] = now;

                await sendWebhookNotification(`
📉 **Performance Budget Exceeded**
**Metric**: ${name}
**Value**: ${value.toFixed(2)} (Budget: ${budget})
**Link**: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard
                `.trim());
            }
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
