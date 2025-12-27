import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { Download, AlertCircle, Loader2 } from 'lucide-react';
import { API_ENDPOINTS, fetchJson } from '../lib/api';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

// --- Types ---

interface ChartPoint {
    date: string;
    value: number;
}

interface AnalyticsData {
    revenueChart: ChartPoint[];
    occupancyChart: ChartPoint[];
    bookingsChart: ChartPoint[]; // FIX: Added bookingsChart to interface
    totalRevenue: number;
    occupancyRate: number;
    totalBookings: number;
}

// --- Components ---

const ReportsPage: React.FC = () => {
    // State
    const [days, setDays] = useState<number>(7);
    const [stats, setStats] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // Fetch Data
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            // FIX: Show loading state immediately to avoid stale data
            setIsLoading(true);
            setError(null);

            try {
                // FIX: Use query parameters correctly (params appended to URL)
                const url = new URL(API_ENDPOINTS.REPORTS);
                url.searchParams.append('days', days.toString());

                const data = await fetchJson(url.toString());

                if (isMounted) {
                    setStats(data);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error("Reports Fetch Error:", err);

                    // FIX: Improved error handling for specific codes
                    if (err.message === "Unauthorized") {
                        setError("Session expired. Please log in again.");
                    } else if (err.message?.includes("422")) {
                        setError("Invalid request parameters.");
                    } else if (err.message?.includes("500")) {
                        setError("Server error. Please try again later.");
                    } else {
                        setError(err.message || "Failed to load reports data.");
                    }
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [days]);

    // Handlers
    const handleExport = async () => {
        setIsExporting(true);
        try {
            // FIX: Placeholder for real API call clearly marked
            // await fetchJson(`${API_ENDPOINTS.REPORTS}/export?days=${days}`);

            // Simulating delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            alert("Export successful (Simulated)");
        } catch (e) {
            alert("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    // Derived Data & Formatters
    const formatDate = (dateStr: string) => {
        // FIX: Safe date parsing
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    };

    const processChartData = (data: ChartPoint[] | undefined) => {
        // FIX: Safe map execution with null check and default value
        return data?.map(d => ({
            ...d,
            value: d.value ?? 0 // FIX: Handle falsy/null values with ?? 0
        })).filter(d => {
            // FIX: Filter out invalid dates to prevent crashes
            const date = new Date(d.date);
            return !isNaN(date.getTime());
        }) ?? [];
    };

    const safeRevenueData = useMemo(() => processChartData(stats?.revenueChart), [stats]);
    const safeOccupancyData = useMemo(() => processChartData(stats?.occupancyChart), [stats]);
    // FIX: Safe access for bookings chart
    const safeBookingsData = useMemo(() => processChartData(stats?.bookingsChart), [stats]);

    // Render Helpers
    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-red-500 space-y-4">
                <AlertCircle className="w-12 h-12" />
                <p className="text-lg font-medium">{error}</p>
                <Button onClick={() => setDays(days)} variant="outline">Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-6">

            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Reports</h1>
                    <p className="text-gray-500">Performance metrics and insights</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={90}>Last 3 Months</option>
                    </select>

                    <Button
                        onClick={handleExport}
                        disabled={isExporting || isLoading}
                        className="flex items-center gap-2"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Loading Overlay or Content */}
            <div className="relative min-h-[400px]">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                )}

                {!isLoading && !stats && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No data available.
                    </div>
                )}

                {/* Dashboard Grid */}
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${isLoading ? 'opacity-50' : ''}`}>

                    {/* Revenue Chart */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-green-500 rounded-full" />
                            Revenue Trend
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={safeRevenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']} labelFormatter={formatDate} />
                                    <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="text-gray-500 text-sm">Total Revenue</span>
                            <p className="text-2xl font-bold text-gray-900">${stats?.totalRevenue?.toLocaleString() ?? '0'}</p>
                        </div>
                    </GlassCard>

                    {/* Occupancy Chart */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full" />
                            Occupancy Rate
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={safeOccupancyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip formatter={(val: any) => [`${val}%`, 'Occupancy']} labelFormatter={formatDate} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="text-gray-500 text-sm">Average Occupancy</span>
                            <p className="text-2xl font-bold text-gray-900">{stats?.occupancyRate ?? 0}%</p>
                        </div>
                    </GlassCard>

                    {/* Bookings Chart (New) */}
                    {/* FIX: Handle booking chart with fallback for missing data */}
                    <GlassCard className="p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-purple-500 rounded-full" />
                            Bookings Overview
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={safeBookingsData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip formatter={(val: any) => [val, 'Bookings']} labelFormatter={formatDate} cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="value" name="Total Bookings" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="text-gray-500 text-sm">Total Bookings Period</span>
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings ?? 0}</p>
                        </div>
                    </GlassCard>

                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
