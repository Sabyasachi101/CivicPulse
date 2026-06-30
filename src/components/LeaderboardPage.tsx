import React, { useEffect, useState } from 'react';
import { Award, Zap, Building2, Flame, Shield, TrendingUp, Trophy, Compass } from 'lucide-react';
import { motion } from 'motion/react';

interface CitizenLeaderboardItem {
  uid: string;
  name: string;
  email: string;
  points: number;
  badges: string[];
  streak: number;
}

interface WardLeaderboardItem {
  ward: string;
  totalIssues: number;
  resolvedIssues: number;
  openIssues: number;
  pulseScore: number;
}

export default function LeaderboardPage() {
  const [citizens, setCitizens] = useState<CitizenLeaderboardItem[]>([]);
  const [wards, setWards] = useState<WardLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'citizens' | 'wards'>('citizens');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setCitizens(data.citizens || []);
      setWards(data.wards || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function handleResetLeaderboard() {
    try {
      setResetting(true);
      setResetStatus(null);
      const res = await fetch('/api/leaderboard/reset', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setResetStatus(data.message);
        await fetchLeaderboard();
        setShowResetConfirm(false);
        setTimeout(() => setResetStatus(null), 5000);
      } else {
        setResetStatus('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error resetting leaderboard:', err);
      setResetStatus('Error: ' + err.message);
    } finally {
      setResetting(false);
    }
  }

  const getRankEmoji = (idx: number) => {
    switch (idx) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${idx + 1}`;
    }
  };

  const getPulseScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20';
    if (score >= 60) return 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/20';
    return 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950/20';
  };

  const getBadgeIcon = (id: string) => {
    switch (id) {
      case 'first_reporter': return '🏆';
      case 'neighborhood_hero': return '🌟';
      case 'verified_contributor': return '🛡️';
      case 'streak_resolver': return '🔥';
      default: return '🏅';
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-7 h-7 text-yellow-500" />
          Leaderboard & Civic Performance
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Tracking top-contributing citizens and assessing the civic health scores (PulseScore™) across Pan-India regions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('citizens')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'citizens'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Top Citizens (Impact Points)
        </button>
        <button
          onClick={() => setActiveTab('wards')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'wards'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Regional Performance (PulseScore™)
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-xs font-mono">Fetching active statistics...</span>
        </div>
      ) : activeTab === 'citizens' ? (
        /* CITIZEN LEADERBOARD */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Rank & Citizen</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Streak & Impact Points</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {citizens.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No active citizens yet. Be the first to report!</div>
                ) : (
                  citizens.map((citizen, idx) => (
                    <motion.div
                      key={citizen.uid}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="px-6 py-4 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 text-sm font-bold font-mono text-center ${idx < 3 ? 'text-lg' : 'text-slate-400'}`}>
                          {getRankEmoji(idx)}
                        </span>
                        <div>
                          <h4 className="font-sans font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            {citizen.name}
                            {idx === 0 && <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">Top Reporter</span>}
                          </h4>
                          {/* Badges Earned */}
                          <div className="flex gap-1 mt-1">
                            {citizen.badges?.map((badgeId) => (
                              <span
                                key={badgeId}
                                className="inline-block text-sm"
                                title={badgeId.replace('_', ' ')}
                              >
                                {getBadgeIcon(badgeId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {citizen.streak > 0 && (
                          <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 text-orange-600 border border-orange-100 dark:border-orange-900/30 px-2 py-0.5 rounded text-xs font-semibold">
                            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600 shrink-0" />
                            <span>{citizen.streak}d</span>
                          </div>
                        )}
                        <span className="font-mono font-bold text-slate-800 dark:text-white text-base bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 px-3 py-1 rounded-lg">
                          +{citizen.points || 0} pts
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Citizen Rewards Details info sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-550 to-indigo-650 text-white rounded-2xl p-6 shadow-sm border border-blue-600">
              <h3 className="font-sans font-bold text-lg mb-2">How Points & Streaks Work</h3>
              <p className="text-blue-100 text-xs leading-relaxed mb-4">
                Be an active participant in your community's improvement! Every action accumulates CivicImpact Points and qualifies you for prestigious local badges.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span>Report an Issue</span>
                  <span className="font-bold text-yellow-300">+10 Points</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span>Upvote/Verify Near You</span>
                  <span className="font-bold text-yellow-300">+5 Points</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span>Issue gets Resolved</span>
                  <span className="font-bold text-yellow-300">+20 Points</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span>Upload Resolution Proof</span>
                  <span className="font-bold text-yellow-300">+15 Points</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-sans font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <Shield className="w-4 h-4 text-blue-600" />
                Badge Milestones
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl bg-slate-50 p-1 rounded-lg">🏆</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200">First Reporter</h5>
                    <p className="text-[10px] text-slate-400">Awarded immediately upon submitting your very first civic issue.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl bg-slate-50 p-1 rounded-lg">🌟</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200">Neighbourhood Hero</h5>
                    <p className="text-[10px] text-slate-400">Granted when 5 of your reported issues have been verified and assigned.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl bg-slate-50 p-1 rounded-lg">🛡️</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200">Verified Contributor</h5>
                    <p className="text-[10px] text-slate-400">Unlocked upon crossing the 100-point threshold.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* WARD PERFORMANCE LEADERBOARD */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              PulseScore™ Explained
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-4xl">
              <strong>PulseScore™</strong> is a dynamic civic health metric (0–100) refreshed weekly for each region. It calculates municipal responsiveness using **resolution rate**, **average resolution times**, and **cumulative density of active open issues** penalized by severity levels. A score above 80 represents exceptional performance.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-150 dark:border-slate-800 grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              <div className="col-span-5 md:col-span-4">Rank & Region / Zone</div>
              <div className="col-span-2 text-center">Total Issues</div>
              <div className="col-span-2 text-center">Resolved</div>
              <div className="col-span-2 text-center">Active Open</div>
              <div className="col-span-1 md:col-span-2 text-right">PulseScore™</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {wards.map((wardItem, idx) => (
                <div
                  key={wardItem.ward}
                  className="px-6 py-4 grid grid-cols-12 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                >
                  <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {getRankEmoji(idx)}
                    </span>
                    <span className="font-sans font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {wardItem.ward}
                    </span>
                  </div>

                  <div className="col-span-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 font-mono">
                    {wardItem.totalIssues}
                  </div>

                  <div className="col-span-2 text-center text-sm font-semibold text-green-600 dark:text-green-400 font-mono">
                    {wardItem.resolvedIssues}
                  </div>

                  <div className="col-span-2 text-center text-sm font-semibold text-red-600 dark:text-red-400 font-mono">
                    {wardItem.openIssues}
                  </div>

                  <div className="col-span-1 md:col-span-2 text-right">
                    <span className={`inline-block border font-bold font-mono text-sm px-3 py-1 rounded-lg ${getPulseScoreColor(wardItem.pulseScore)}`}>
                      {wardItem.pulseScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
