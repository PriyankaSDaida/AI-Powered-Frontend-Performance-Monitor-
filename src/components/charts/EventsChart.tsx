'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartProps {
    data: any[];
}

export default function EventsChart({ data }: ChartProps) {
    if (data.length === 0) {
        return <div className="h-[300px] flex items-center justify-center text-gray-400">No data available yet</div>;
    }

    const formattedData = data.map(d => ({
        ...d,
        timeLabel: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="timeLabel"
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="vitals"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        name="Web Vitals"
                    />
                    <Line
                        type="monotone"
                        dataKey="errors"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        name="Errors"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
