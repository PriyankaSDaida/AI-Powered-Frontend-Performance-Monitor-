import { getDashboardStats, getEventTimeSeries, VitalMetric } from '@/services/analytics';
import EventsChart from '@/components/charts/EventsChart';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Force dynamic rendering so we collect fresh data on refresh
export const dynamic = 'force-dynamic';

function MetricCard({ metric }: { metric: VitalMetric }) {
    const color =
        metric.rating === 'good' ? 'bg-green-50 text-green-700 border-green-200' :
            metric.rating === 'needs-improvement' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200';

    const icon =
        metric.rating === 'good' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
            metric.rating === 'needs-improvement' ? <AlertTriangle className="w-5 h-5 text-yellow-600" /> :
                <XCircle className="w-5 h-5 text-red-600" />;

    return (
        <div className={cn("p-6 rounded-xl border flex flex-col justify-between h-32", color)}>
            <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{metric.name}</span>
                {icon}
            </div>
            <div className="text-3xl font-bold">
                {metric.value ? metric.value.toFixed(2) : '-'}
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    const appId = 'self-monitor-001';
    const stats = await getDashboardStats(appId, '24h');
    const timeSeries = await getEventTimeSeries(appId, '24h');

    return (
        <div className="space-y-8">
            {/* Vitals Grid */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Core Web Vitals (P75, Last 24h)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats.vitals.map(v => (
                        <MetricCard key={v.name} metric={v} />
                    ))}
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Traffic & Errors Trend</h3>
                <EventsChart data={timeSeries} />
            </div>

            {/* Recent Errors */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-800">Recent Errors</h3>
                    <span className="text-sm text-gray-500">Total: {stats.errorCount}</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {stats.recentErrors.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No errors recorded recently.</div>
                    ) : (
                        stats.recentErrors.map((err: any, i: number) => (
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
                                <div className="mt-2 flex gap-2">
                                    {err.filename && <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{err.filename}</span>}
                                    {err.type && <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100">{err.type}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
