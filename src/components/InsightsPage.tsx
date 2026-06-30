import React, { useEffect, useState } from 'react';
import { Insight } from '../types';
import { Sparkles, Brain, CloudRain, Building2, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  async function fetchInsights(forceRefresh: boolean = false) {
    setLoading(true);
    try {
      const res = await fetch(`/api/insights${forceRefresh ? '?refresh=true' : ''}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setInsights(data);
      } else {
        console.error('Insights response is not an array:', data);
        setInsights([]);
      }
    } catch (err) {
      console.error('Error loading AI insights:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleRefresh = async () => {
    setRegenerating(true);
    try {
      // Direct call to refresh or seed insights with force refresh
      await fetchInsights(true);
    } catch (err) {
      console.log(err);
    } finally {
      setRegenerating(false);
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20';
    return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20';
  };

  const getMonsoonActionPlan = (cat: string) => {
    switch (cat) {
      case 'Drainage & Flooding':
        return 'Clear stormwater drains, unclog cross-street culverts, and deploy high-power water pumps.';
      case 'Pothole & Roads':
        return 'Schedule asphalt cold patching, level sub-base layers, and fix water-pooling dips.';
      case 'Garbage & Sanitation':
        return 'Increase secondary loaders frequency, clear black spot dump clusters, and post warning boards.';
      case 'Streetlight & Electricity':
        return 'Insulate transformer wiring joints, inspect loose overhead cables, and replace defective sodium lamps.';
      default:
        return 'Conduct preventive maintenance checks with relevant municipal engineers.';
    }
  };

  return (
    <div className="py-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
            AI Regional Insights
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gemini-powered municipal diagnostics analyzing recent reported issues, trends, and predicting hotspots.
          </p>
        </div>

        {/* Trigger re-analysis */}
        <button
          onClick={handleRefresh}
          disabled={regenerating}
          className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating...' : 'Regenerate Analytics'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-xs font-mono">Running Gemini Urban Diagnostics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Insights list */}
          <div className="lg:col-span-2 space-y-6">
            {insights.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-widest block">Regional Health Profile</span>
                    <h3 className="font-sans font-extrabold text-slate-850 dark:text-white text-base">
                      {insight.ward}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-3 py-1 font-mono font-bold text-xs rounded-lg border ${getScoreColorClass(insight.pulseScore)}`}>
                      PulseScore™ {insight.pulseScore}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      Refreshed today
                    </span>
                  </div>
                </div>

                {/* Gemini Insight Summary box */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850 flex gap-3.5">
                  <Brain className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-450 font-mono">Gemini AI Synthesis</span>
                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans font-medium">
                      {insight.summary}
                    </p>
                  </div>
                </div>

                {/* Hotspot & Recommended Monsoon Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="border border-slate-100 dark:border-slate-850 rounded-xl p-3 bg-white dark:bg-slate-900">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Top Hotspot Category</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-250 mt-1 block flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      {insight.topCategory}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{insight.issueCount} total reported reports</span>
                  </div>

                  <div className="border border-indigo-50 dark:border-indigo-950/20 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-xl p-3">
                    <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider font-mono block">Recommended Actions</span>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                      {getMonsoonActionPlan(insight.topCategory)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right sidebar info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-sans font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <CloudRain className="w-4.5 h-4.5 text-blue-600" />
                Monsoon Preparedness
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                During monsoon cycles, drainage and water leakages are automatically allocated high-priority indices by our routing engine. Double checking storm inlets in cities like New Delhi and Mumbai avoids localized street flooding.
              </p>
              
              <div className="border-t border-slate-100 dark:border-slate-850 pt-3 text-[10px] text-slate-400 space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span>Current Season:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">Pre-Monsoon</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>High Alert Regions:</span>
                  <span className="font-bold text-red-600">Mumbai, Kolkata</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-sans font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <TrendingUp className="w-4.5 h-4.5 text-green-600" />
                Impact Indicators
              </h4>
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-green-600 font-bold bg-green-50 p-1 rounded font-mono">80+</span>
                  <div>
                    <h5 className="font-bold text-slate-700 dark:text-slate-200">Responsive Region</h5>
                    <p className="text-[10px] text-slate-450 leading-tight mt-0.5">Prompt clearing of reports within standard SLA days limit.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-amber-600 font-bold bg-amber-50 p-1 rounded font-mono">60-80</span>
                  <div>
                    <h5 className="font-bold text-slate-700 dark:text-slate-200">Under Observation</h5>
                    <p className="text-[10px] text-slate-450 leading-tight mt-0.5">Complaints compiling faster than completions. Minor bottlenecks.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-red-600 font-bold bg-red-50 p-1 rounded font-mono">Below 60</span>
                  <div>
                    <h5 className="font-bold text-slate-700 dark:text-slate-200">Critical Status</h5>
                    <p className="text-[10px] text-slate-450 leading-tight mt-0.5">Severe backlogs or multiple high-severity SLA breaches. Deserves escalation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
