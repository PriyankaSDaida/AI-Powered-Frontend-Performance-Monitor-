import { getDashboardStats, getEventTimeSeries, VitalMetric } from '@/services/analytics';
import EventsChart from '@/components/charts/EventsChart';
import ErrorList from './ErrorList';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
            <ErrorList errors={stats.recentErrors} />
        </div>
    );
}
