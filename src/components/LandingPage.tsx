import React from 'react';
import { Camera, MapPin, BarChart3, ShieldAlert, Award, ArrowRight, Activity, CloudRain, ShieldCheck, LogIn, Lock } from 'lucide-react';
import { Issue, UserProfile } from '../types';
import LoginPage from './LoginPage';

interface LandingPageProps {
  issues: Issue[];
  onNavigate: (tab: string) => void;
  onSelectIssue?: (issue: Issue) => void;
  currentUser: UserProfile | null;
  onAuthSuccess?: (profile: UserProfile) => void;
}

export default function LandingPage({ 
  issues, 
  onNavigate, 
  onSelectIssue, 
  currentUser,
  onAuthSuccess
}: LandingPageProps) {
  // Aggregate basic numbers
  const total = issues.length;
  const resolved = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
  const inProgress = issues.filter(i => i.status === 'in_progress' || i.status === 'assigned').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Split-screen Layout for Guest / Unauthenticated users
  if (!currentUser) {
    return (
      <div className="py-4">
        <div className="flex flex-col lg:flex-row gap-12 lg:items-start items-center">
          
          {/* Left Column (50%): All the text and facts */}
          <div className="flex-1 space-y-8 text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
              <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
              <span>Civic Responsiveness For Indian Cities</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-sans font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                Empower Your Ward. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Resolve Civic Issues.
                </span>
              </h1>

              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                CivicPulse lets citizens upload photo proof of potholes, water leakages, broken streetlights, or garbage heaps. AI auto-categorizes, flags duplicates, and routes issues to municipal boards with tracking SLAs.
              </p>
            </div>

            {/* Platform Highlights / Facts */}
            <div className="space-y-4 border-t border-slate-150 dark:border-slate-800 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Platform Highlights</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Visual Diagnostics</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Our Gemini neural engine automatically classifies categories and rates hazard severity levels from uploaded photos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Strict SLA Tracking</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Allocated departments (PWD, BWSSB, BESCOM) are held accountable to specific deadline timers to prevent breaches.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Hyperlocal Gamification</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Accumulate points, maintain streaks, and earn prestigious badges like Neighborhood Hero!
                    </p>
                  </div>
                </div>
              </div>
            </div>



          </div>

          {/* Right Column (50%): Auth and Login Panel */}
          <div className="flex-1 w-full max-w-md">
            {onAuthSuccess && (
              <LoginPage onAuthSuccess={onAuthSuccess} />
            )}
          </div>

        </div>

        {/* CITY STATS TICKER FOR GUESTS */}
        <div className="mt-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl px-8 py-5 flex flex-wrap gap-8 justify-around items-center text-center shadow-xs">
          <div className="space-y-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono block">{total}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Logged Concerns</span>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div className="space-y-1">
            <span className="text-2xl font-black text-green-600 font-mono block">{resolved}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resolved Repairs</span>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div className="space-y-1">
            <span className="text-2xl font-black text-amber-500 font-mono block">{inProgress}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Under Repair Work</span>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div className="space-y-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono block">
              {resolutionRate}%
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resolution Rate</span>
          </div>
        </div>

      </div>
    );
  }

  // Standard Layout for Authenticated users
  return (
    <div className="space-y-12 py-4">

      {/* HERO SECTION */}
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        
        {/* Left column */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm">
            <Activity className="w-4 h-4 text-blue-600 animate-spin" />
            <span>Civic Responsiveness For Indian Cities</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-sans font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            Empower Your Ward. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Resolve Civic Issues.
            </span>
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg mx-auto lg:mx-0">
            CivicPulse lets citizens upload photo proof of potholes, water leakages, broken streetlights, or garbage heaps. AI auto-categorizes, flags duplicates, and routes issues to municipal boards with tracking SLAs.
          </p>

          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <button
              onClick={() => onNavigate('report')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <Camera className="w-4.5 h-4.5" />
              Report a Problem Now
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-sm px-6 py-3.5 rounded-2xl flex items-center gap-1.5 active:scale-95 transition-transform shadow-sm"
            >
              <MapPin className="w-4.5 h-4.5 text-red-500" />
              Explore Issue Map
            </button>
          </div>
        </div>

        {/* Right column (Visual bento grid illustration) */}
        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Visual Diagnostics</h3>
              <p className="text-[11px] text-slate-400 leading-normal mt-1">
                Our Gemini neural engine automatically classifies category type and rates hazard severity levels from uploaded photos.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Strict SLA Tracking</h3>
              <p className="text-[11px] text-slate-400 leading-normal mt-1">
                Allocated departments (PWD, BWSSB, BESCOM) are held accountable to specific deadline timers to prevent breaches.
              </p>
            </div>
          </div>

          <div className="col-span-2 bg-gradient-to-br from-indigo-550 to-purple-650 text-white rounded-3xl p-6 shadow-md border border-indigo-600 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold font-mono uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                Hyperlocal Gamification
              </span>
              <Award className="w-5 h-5 text-yellow-300 animate-bounce" />
            </div>
            <h3 className="text-base font-sans font-black leading-snug">
              Accumulate points, maintain streaks, and earn prestigious badges.
            </h3>
            <p className="text-indigo-100 text-xs leading-normal">
              Contribute to your ward's PulseScore™ and gain titles like Neighbourhood Hero or Verified Contributor!
            </p>
          </div>

        </div>

      </div>

      {/* CITY STATS TICKER */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl px-8 py-5 flex flex-wrap gap-8 justify-around items-center text-center shadow-xs">
        <div className="space-y-1">
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono block">{total}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Logged Concerns</span>
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block" />

        <div className="space-y-1">
          <span className="text-2xl font-black text-green-600 font-mono block">{resolved}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resolved Repairs</span>
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block" />

        <div className="space-y-1">
          <span className="text-2xl font-black text-amber-500 font-mono block">{inProgress}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Under Repair Work</span>
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block" />

        <div className="space-y-1">
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono block">
            {resolutionRate}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resolution Rate</span>
        </div>
      </div>

    </div>
  );
}
