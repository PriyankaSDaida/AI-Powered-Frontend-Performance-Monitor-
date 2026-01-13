import Link from 'next/link';
import { LayoutDashboard, AlertCircle, Activity, Settings } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-50 text-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        AI Monitor
                    </h1>
                </div>
                <nav className="p-4 space-y-1">
                    <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg bg-blue-50 text-blue-700">
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Overview</span>
                    </Link>
                    <Link href="#" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                        <Activity className="w-5 h-5" />
                        <span>Performance</span>
                    </Link>
                    <Link href="#" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                        <AlertCircle className="w-5 h-5" />
                        <span>Errors</span>
                    </Link>
                    <Link href="#" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between">
                    <h2 className="text-lg font-semibold text-gray-700">Project: self-monitor-001</h2>
                    <div className="text-sm text-gray-500">MVP Release 0.1</div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
