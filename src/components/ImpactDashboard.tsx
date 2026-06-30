import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  LayoutDashboard, TrendingUp, AlertTriangle, CheckCircle2, 
  Clock, ShieldAlert, Sparkles, AlertCircle 
} from 'lucide-react';

interface StatsData {
  total: number;
  resolved: number;
  pending: number;
  avgResolutionTime: number;
  categoryCounts: { [key: string]: number };
  wardStats: {
    ward: string;
    total: number;
    resolved: number;
    pending: number;
    resolutionRate: number;
  }[];
  trendData: {
    week: string;
    reported: number;
    resolved: number;
  }[];
}

interface Insight {
  id: string;
  ward: string;
  summary: string;
  generatedAt: string;
  issueCount: number;
  topCategory: string;
  pulseScore: number;
}

export default function ImpactDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const statsRes = await fetch('/api/dashboard/stats');
        const statsData = await statsRes.json();
        setStats(statsData);

        const insightsRes = await fetch('/api/insights');
        const insightsData = await insightsRes.json();
        setInsights(insightsData || []);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xs font-mono">Assembling real-time impact metrics...</span>
      </div>
    );
  }

  // Parse category counts for BarChart
  const barChartData = Object.entries(stats.categoryCounts).map(([name, value]) => ({
    name,
    count: value
  }));

  const COLORS = ['#1E40AF', '#16A34A', '#D97706', '#DC2626', '#8B5CF6', '#06B6D4', '#64748B'];

  // Identify best and worst performing wards based on resolution rate
  const sortedWards = [...stats.wardStats].sort((a, b) => b.resolutionRate - a.resolutionRate);
  const bestWard = sortedWards[0];
  const worstWard = sortedWards[sortedWards.length - 1];

  // Pick the top predictive AI Insight
  const topPredictiveInsight = insights.length > 0 
    ? insights.reduce((max, ins) => (ins.issueCount > max.issueCount ? ins : max), insights[0])
    : null;

  return (
    <div className="py-6 space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LayoutDashboard className="w-7 h-7 text-blue-600" />
          Public Impact & Analytics
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Real-time metrics tracking municipal responsiveness, category distributions, and predictive hotspots.
        </p>
      </div>

      {/* Stats Ticker */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Total Logged</span>
            <AlertTriangle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-850 dark:text-white font-mono">{stats.total}</div>
          <p className="text-[10px] text-slate-400 font-medium">Accumulated reports by citizens</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Resolved</span>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600 font-mono">{stats.resolved}</div>
          <p className="text-[10px] text-slate-400 font-medium">
            {Math.round((stats.resolved / (stats.total || 1)) * 100)}% total resolution rate
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Active Pending</span>
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-500 font-mono">{stats.pending}</div>
          <p className="text-[10px] text-slate-400 font-medium">Currently under official review</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Avg Resolution</span>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-purple-500 font-mono">{stats.avgResolutionTime}d</div>
          <p className="text-[10px] text-slate-400 font-medium">Days from submittal to completion</p>
        </div>
      </div>

      {/* AI Hotspot Prediction Highlight Card */}
      {topPredictiveInsight && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-indigo-950/20 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-start">
          <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-md shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-400 font-mono">
                AI Hotspot Prediction
              </span>
              <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                Refreshed Weekly
              </span>
            </div>
            <h3 className="text-base font-sans font-extrabold text-slate-850 dark:text-white">
              Critical Warnings in {topPredictiveInsight.ward}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {topPredictiveInsight.summary}
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[400px]">
          <div>
            <h3 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider mb-1">
              Issues by Category
            </h3>
            <p className="text-[11px] text-slate-400">Total volume breakdown across all reported categories.</p>
          </div>
          
          <div className="flex-1 min-h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend Line */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[400px]">
          <div>
            <h3 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider mb-1">
              Resolution Trends
            </h3>
            <p className="text-[11px] text-slate-400">Comparing newly reported vs completed items over the last 12 weeks.</p>
          </div>

          <div className="flex-1 min-h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="reported" name="New Reports" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="resolved" name="Resolved Issues" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Regional Performance Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
            Regional Performance Comparison
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Comparing municipal response efficiency rates across regions.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10 rounded-xl p-4 flex gap-3.5 items-center">
            <div className="bg-green-600 text-white rounded-lg p-2 font-bold font-mono text-xs shrink-0">
              {bestWard?.resolutionRate}%
            </div>
            <div>
              <h4 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Best Performing Region</h4>
              <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm mt-0.5">{bestWard?.ward}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{bestWard?.resolved} of {bestWard?.total} issues successfully resolved</p>
            </div>
          </div>

          <div className="border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl p-4 flex gap-3.5 items-center">
            <div className="bg-amber-600 text-white rounded-lg p-2 font-bold font-mono text-xs shrink-0">
              {worstWard?.resolutionRate}%
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Needs Escalation</h4>
              <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm mt-0.5">{worstWard?.ward}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{worstWard?.pending} pending active complaints requiring municipal crew dispatch</p>
            </div>
          </div>
        </div>

        {/* Grid Table */}
        <div className="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden mt-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 px-5 py-3 border-b border-slate-150 dark:border-slate-850 grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            <div className="col-span-5 md:col-span-6">Region / Zone</div>
            <div className="col-span-2 text-center">Reported</div>
            <div className="col-span-2 text-center">Resolved</div>
            <div className="col-span-3 md:col-span-2 text-right">Completion Rate</div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.wardStats.map((item) => (
              <div key={item.ward} className="px-5 py-3 grid grid-cols-12 items-center text-xs text-slate-600 dark:text-slate-300">
                <div className="col-span-5 md:col-span-6 font-bold text-slate-800 dark:text-slate-100">{item.ward}</div>
                <div className="col-span-2 text-center font-mono">{item.total}</div>
                <div className="col-span-2 text-center font-mono text-green-600 dark:text-green-400">{item.resolved}</div>
                <div className="col-span-3 md:col-span-2 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400">
                  {item.resolutionRate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
