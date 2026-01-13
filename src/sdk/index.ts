import { onCLS, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { v4 as uuidv4 } from 'uuid';
import { record } from 'rrweb';

interface Config {
    appId: string;
    ingestUrl: string;
    disableAnalytics?: boolean;
}

interface MonitorEvent {
    type: 'vital' | 'error' | 'navigation';
    payload: any; // Metric or Error details
    timestamp: number;
}

class AIFrontendMonitor {
    private config: Config;
    private eventBuffer: MonitorEvent[] = [];
    private replayEvents: any[] = [];
    private batchSize = 5;
    private flushInterval = 5000;
    private isProcessing = false;

    constructor(config: Config) {
        this.config = config;
        if (!this.config.disableAnalytics) {
            this.initVitals();
            this.initErrorTracking();
            this.initSessionReplay();
            this.startFlushInterval();
        }
    }

    private initSessionReplay() {
        if (typeof window !== 'undefined') {
            record({
                emit: (event) => {
                    this.replayEvents.push(event);
                    // Keep last 100 events to avoid memory bloat
                    if (this.replayEvents.length > 100) {
                        this.replayEvents.shift();
                    }
                },
            });
        }
    }

    private initVitals() {
        onCLS((metric) => this.logVital(metric));
        onINP((metric) => this.logVital(metric));
        onLCP((metric) => this.logVital(metric));
        onTTFB((metric) => this.logVital(metric));
    }

    private logVital(metric: Metric) {
        this.pushEvent({
            type: 'vital',
            payload: metric,
            timestamp: Date.now(),
        });
    }

    private initErrorTracking() {
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.pushEvent({
                    type: 'error',
                    payload: {
                        message: event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        stack: event.error?.stack,
                        replayEvents: [...this.replayEvents] // Attach current session replay
                    },
                    timestamp: Date.now()
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.pushEvent({
                    type: 'error',
                    payload: {
                        message: event.reason?.message || 'Unhandled Rejection',
                        stack: event.reason?.stack,
                        type: 'unhandledrejection',
                        replayEvents: [...this.replayEvents] // Attach current session replay
                    },
                    timestamp: Date.now()
                });
            });
        }
    }

    private pushEvent(event: MonitorEvent) {
        this.eventBuffer.push(event);
        if (this.eventBuffer.length >= this.batchSize) {
            this.flush();
        }
    }

    private startFlushInterval() {
        setInterval(() => {
            if (this.eventBuffer.length > 0) {
                this.flush();
            }
        }, this.flushInterval);
    }

    private async flush() {
        if (this.isProcessing || this.eventBuffer.length === 0) return;
        this.isProcessing = true;

        const eventsToSend = [...this.eventBuffer];
        this.eventBuffer = []; // Clear buffer

        try {
            await fetch(this.config.ingestUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: this.config.appId,
                    events: eventsToSend,
                    commonMetadata: {
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                    }
                }),
                keepalive: true, // Attempt to send even if page is closing
            });
        } catch (err) {
            console.error('Failed to send metrics', err);
            // perform retry logic or drop? For MVP, drop.
        } finally {
            this.isProcessing = false;
        }
    }
}

// Singleton or Factory
let instance: AIFrontendMonitor | null = null;

export const initMonitor = (config: Config) => {
    if (!instance) {
        instance = new AIFrontendMonitor(config);
        console.log('AI Monitor Initialized');
    }
    return instance;
};

export default AIFrontendMonitor;
