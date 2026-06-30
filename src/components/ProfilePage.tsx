import React, { useEffect, useState } from 'react';
import { UserProfile, Issue, BADGES_LIST } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, Award, Flame, Zap, Shield, HelpCircle, History, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfilePageProps {
  userProfile: UserProfile | null;
  onRefreshProfile?: () => void;
  onSelectIssue?: (issue: Issue) => void;
}

export default function ProfilePage({ userProfile, onRefreshProfile, onSelectIssue }: ProfilePageProps) {
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [streakFreezeSuccess, setStreakFreezeSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserIssues() {
      if (!userProfile) return;
      try {
        const res = await fetch(`/api/issues?reportedBy=${userProfile.uid}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setUserIssues(data);
        } else {
          console.error('User issues response is not an array:', data);
          setUserIssues([]);
        }
      } catch (err) {
        console.error('Error fetching user issues:', err);
      } finally {
        setLoadingIssues(false);
      }
    }
    fetchUserIssues();
  }, [userProfile]);

  const handleBuyStreakFreeze = async () => {
    if (!userProfile || userProfile.points < 50) return;

    try {
      const userRef = doc(db, 'users', userProfile.uid);
      const updatedPoints = userProfile.points - 50;
      await updateDoc(userRef, {
        points: updatedPoints
      });
      
      setStreakFreezeSuccess('Active! Your streak is frozen for the next 48 hours.');
      if (onRefreshProfile) {
        onRefreshProfile();
      }
      setTimeout(() => setStreakFreezeSuccess(null), 5000);
    } catch (err) {
      console.error('Failed to buy streak freeze:', err);
    }
  };

  if (!userProfile) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center bg-white dark:bg-slate-900 max-w-lg mx-auto my-12">
        <User className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-sans font-semibold text-slate-800 dark:text-slate-200">Please Sign In</h3>
        <p className="text-sm text-slate-400 mt-1">
          You must be logged in to view your impact statistics, earn streaks, and track your badges.
        </p>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'text-green-600 bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900/30';
      case 'in_progress':
        return 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30';
      case 'assigned':
        return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30';
      default:
        return 'text-red-600 bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30';
    }
  };

  return (
    <div className="py-6 space-y-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        {/* Profile Avatar Grid */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-md relative shrink-0">
          {userProfile.name.charAt(0).toUpperCase()}
          <span className="absolute -bottom-1.5 -right-1.5 bg-yellow-500 text-white rounded-full p-1 border-2 border-white dark:border-slate-900">
            <Award className="w-3.5 h-3.5 fill-white" />
          </span>
        </div>

        {/* Identity */}
        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-xl font-sans font-bold text-slate-850 dark:text-white">{userProfile.name}</h2>
            <span className="inline-block self-center md:self-start bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 text-[10px] font-extrabold uppercase tracking-widest font-mono px-2 py-0.5 rounded-full">
              {userProfile.role}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-medium">{userProfile.email}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Registered Ward: <span className="text-slate-700 dark:text-slate-200">{userProfile.ward}</span>
          </p>
        </div>

        {/* Impact points */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-center min-w-[120px]">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">Impact Points</span>
          <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1 block">+{userProfile.points}</span>
        </div>
      </div>

      {/* Gamified Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CivicStreaks Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-sans font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-600 fill-orange-500 shrink-0" />
                CivicStreaks
              </h3>
              <span className="text-[10px] font-bold text-slate-400 font-mono">Streak System</span>
            </div>
            
            <div className="flex items-center gap-4 py-2">
              <div className="text-4xl font-black text-orange-600 dark:text-orange-500 font-mono flex items-baseline">
                {userProfile.streak || 1}
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">Days</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Report issues on consecutive days to build your active streak! Long streaks earn specialized profile crowns.
              </p>
            </div>
          </div>

          {/* Streak Freeze Store */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Streak Freeze Power-Up</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">50 Points</span>
            </div>

            <button
              onClick={handleBuyStreakFreeze}
              disabled={userProfile.points < 50}
              className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                userProfile.points >= 50
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Equip Streak Freeze
            </button>

            {streakFreezeSuccess && (
              <p className="text-[11px] font-semibold text-green-600 text-center animate-pulse mt-1">
                {streakFreezeSuccess}
              </p>
            )}
            <p className="text-[10px] text-slate-450 dark:text-slate-500 text-center">
              Freezing stops your streak from resetting if you miss a reporting cycle.
            </p>
          </div>
        </div>

        {/* Badges Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            Impact Badges Earned
          </h3>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            {BADGES_LIST.map((badge) => {
              const isEarned = userProfile.badges?.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`border rounded-xl p-3 flex gap-2.5 items-start transition-opacity ${
                    isEarned 
                      ? 'border-blue-100 bg-blue-50/20 dark:border-blue-900/30 dark:bg-blue-950/10' 
                      : 'border-slate-100 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-900/50 opacity-40'
                  }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{badge.name}</h4>
                    <p className="text-[10px] text-slate-400 leading-tight">{badge.desc}</p>
                    {isEarned && (
                      <span className="inline-block text-[9px] font-bold text-blue-600 dark:text-blue-400 font-mono mt-1">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Reported History List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-sans font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <History className="w-4.5 h-4.5 text-blue-600" />
          My Reported Issues ({userIssues.length})
        </h3>

        {loadingIssues ? (
          <div className="py-8 text-center text-slate-400 text-xs font-mono">Loading history...</div>
        ) : userIssues.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-100 dark:border-slate-850 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            You have not submitted any reports yet. Open the reporting panel to log a municipal problem!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {userIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue && onSelectIssue(issue)}
                className="py-3.5 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer px-2 rounded-lg transition-colors"
              >
                <div className="space-y-1 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-450 uppercase tracking-wider">
                      {issue.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(issue.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <h4 className="text-sm font-sans font-bold text-slate-800 dark:text-slate-100 truncate max-w-[400px]">
                    {issue.title}
                  </h4>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-mono text-slate-500">+{issue.upvotes?.length || 0}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full font-mono ${getStatusStyle(issue.status)}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
