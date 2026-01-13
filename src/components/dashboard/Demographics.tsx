'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Globe } from 'lucide-react';

interface DemographicsProps {
    data: {
        browsers: { name: string; value: number }[];
        countries: { name: string; value: number }[];
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Demographics({ data }: DemographicsProps) {
    const { browsers, countries } = data;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Browser Share */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Browser Share</h3>
                <div className="h-64">
                    {browsers.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={browsers}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {browsers.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">No data available</div>
                    )}
                </div>
            </div>

            {/* Top Countries */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-gray-500" />
                    Top Countries
                </h3>
                <div className="space-y-4">
                    {countries.length > 0 ? (
                        countries.slice(0, 5).map((country, index) => {
                            const maxVal = countries[0].value;
                            const percent = (country.value / maxVal) * 100;

                            return (
                                <div key={country.name} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{country.name}</span>
                                        <span className="text-gray-500">{country.value} users</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex h-32 items-center justify-center text-gray-400">No data available</div>
                    )}
                </div>
            </div>
        </div>
    );
}
