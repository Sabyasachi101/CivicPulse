import React, { useEffect, useState } from 'react';
import { 
  auth, db, getUserProfile, logoutUser 
} from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, query, where, getDocs, onSnapshot, doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  Issue, UserProfile, Notification, WARDS_LIST, CATEGORIES_LIST 
} from './types';
import LandingPage from './components/LandingPage';
import MapComponent from './components/MapComponent';
import ReportPage from './components/ReportPage';
import IssueDetailPage from './components/IssueDetailPage';
import ImpactDashboard from './components/ImpactDashboard';
import LeaderboardPage from './components/LeaderboardPage';
import ProfilePage from './components/ProfilePage';
import OfficialDashboard from './components/OfficialDashboard';
import InsightsPage from './components/InsightsPage';
import LoginPage from './components/LoginPage';

import { 
  Activity, MapPin, Camera, BarChart3, Award, Sparkles, Building2, 
  User, LogOut, Flame, Moon, Sun, CloudRain, Wifi, WifiOff, Bell, LogIn 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Synced URL Router Hook
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/issues/')) {
        const id = path.split('/issues/')[1];
        if (id) {
          setSelectedIssueId(id);
          setActiveTab('issue-detail');
        }
      } else {
        const tab = path.substring(1) || 'home';
        // Safeguard to valid tabs
        const validTabs = ['home', 'map', 'report', 'dashboard', 'leaderboard', 'insights', 'official', 'profile', 'login'];
        if (validTabs.includes(tab)) {
          setActiveTab(tab);
          setSelectedIssueId(null);
        } else {
          setActiveTab('home');
          setSelectedIssueId(null);
        }
      }
    };

    // Load initial URL on mount
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Central navigation trigger updating browser address bar pushState
  const navigateTo = (tab: string, issueId: string | null = null) => {
    const publicTabs = ['home', 'login'];
    if (!authLoading && !currentUser && !publicTabs.includes(tab)) {
      setActiveTab('login');
      setSelectedIssueId(null);
      if (window.location.pathname !== '/login') {
        window.history.pushState({}, '', '/login');
      }
      return;
    }

    setActiveTab(tab);
    setSelectedIssueId(issueId);
    let targetPath = '/';
    if (tab === 'issue-detail' && issueId) {
      targetPath = `/issues/${issueId}`;
    } else if (tab !== 'home') {
      targetPath = `/${tab}`;
    }
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Enforce auth state checking in activeTab
  useEffect(() => {
    if (!authLoading) {
      const publicTabs = ['home', 'login'];
      if (!currentUser && !publicTabs.includes(activeTab)) {
        setActiveTab('login');
        setSelectedIssueId(null);
        if (window.location.pathname !== '/login') {
          window.history.pushState({}, '', '/login');
        }
      }
    }
  }, [currentUser, activeTab, authLoading]);
  
  // Custom features states
  const [monsoonModeActive, setMonsoonModeActive] = useState<boolean>(() => {
    return localStorage.getItem('civicpulse_monsoon_mode') === 'true';
  });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    return localStorage.getItem('civicpulse_theme') === 'dark';
  });

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Sync dark theme on mount
  useEffect(() => {
    if (darkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkTheme]);

  // Handle dark mode toggle
  const toggleDarkTheme = () => {
    const nextTheme = !darkTheme;
    setDarkTheme(nextTheme);
    localStorage.setItem('civicpulse_theme', nextTheme ? 'dark' : 'light');
  };

  // Toggle Monsoon Mode
  const toggleMonsoonMode = () => {
    const nextVal = !monsoonModeActive;
    setMonsoonModeActive(nextVal);
    localStorage.setItem('civicpulse_monsoon_mode', String(nextVal));
  };

  // Fetch all issues from backend REST API
  const fetchIssuesList = async () => {
    try {
      const res = await fetch('/api/issues');
      const data = await res.json();
      if (Array.isArray(data)) {
        setIssues(data);
      } else {
        console.error('API response is not an array:', data);
        setIssues([]);
      }
    } catch (err) {
      console.error('Failed to load issues list from Express REST API:', err);
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    fetchIssuesList();
  }, []);

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        let profile = await getUserProfile(fUser.uid);
        if (profile && profile.role === 'citizen' && profile.points === 10) {
          // Clean legacy starting points/badges to match the fresh database slate
          profile.points = 0;
          profile.badges = [];
          profile.streak = 0;
          try {
            await updateDoc(doc(db, 'users', fUser.uid), {
              points: 0,
              badges: [],
              streak: 0
            });
          } catch (e) {
            console.error('Failed to clear legacy points from user doc:', e);
          }
        }
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for current user's notifications in Firestore
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      // Sort by creation date descending
      setNotifications(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle Clear Notifications
  const handleClearNotifications = async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Handle Offline to Online synchronization
  useEffect(() => {
    if (isOnline) {
      const syncOfflineReports = async () => {
        const offlineQueueStr = localStorage.getItem('civicpulse_offline_reports');
        if (!offlineQueueStr) return;

        const offlineQueue = JSON.parse(offlineQueueStr);
        if (offlineQueue.length === 0) return;

        console.log(`Discovered ${offlineQueue.length} offline cached reports. Synchronizing...`);

        for (const item of offlineQueue) {
          try {
            const res = await fetch('/api/issues', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: item.title,
                description: item.description,
                category: item.category,
                severity: item.severity,
                location: item.location,
                media: item.media,
                reportedBy: item.reportedBy,
                reportedByName: item.reportedByName,
                source: item.source
              })
            });

            if (res.ok) {
              console.log('Successfully synchronized report.');
            }
          } catch (err) {
            console.error('Failed to sync offline report, retaining in cache:', err);
          }
        }

        // Clear synchronized reports queue
        localStorage.removeItem('civicpulse_offline_reports');
        fetchIssuesList();
        alert('🔄 Sync Complete: Your offline queued reports have been successfully synchronised with municipal servers!');
      };

      syncOfflineReports();
    }
  }, [isOnline]);

  const handleLogout = async () => {
    await logoutUser();
    navigateTo('home');
  };

  const handleSelectIssue = (issue: Issue) => {
    navigateTo('issue-detail', issue.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* HEADER NAVBAR: Sticky floating blurred capsule */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-150 dark:border-slate-850 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & Brand on Left */}
          <div 
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-base font-sans tracking-tight block">
                CivicPulse
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                Hyperlocal Indian Cities
              </span>
            </div>
          </div>

           {/* Redesigned Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            {currentUser && [
              { id: 'map', label: 'Issue Map' },
              { id: 'report', label: 'Report Issue' },
              { id: 'dashboard', label: 'Public Impact' },
              { id: 'leaderboard', label: 'Leaderboard' },
              { id: 'insights', label: 'AI Insights' },
              { id: 'official', label: 'Official Portal' }
            ].map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => navigateTo(link.id)}
                  className={`px-3 py-2 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-855 dark:hover:text-slate-200'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right-Aligned Actions & User Badges */}
          <div className="flex items-center gap-3">
            
            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkTheme}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center"
              title="Toggle Theme"
            >
              {darkTheme ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification bell and popover */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center relative"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 text-xs">
                    <h4 className="font-bold border-b pb-2 mb-2 text-slate-800 dark:text-slate-100 flex justify-between">
                      <span>Notifications</span>
                      {notifications.length > 0 && (
                        <span 
                          onClick={handleClearNotifications}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          Clear
                        </span>
                      )}
                    </h4>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 text-center py-4">No new notifications.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="border-b pb-2 last:border-none last:pb-0 space-y-1">
                            <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{notif.message}</p>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Avatar or Login Trigger with Flame streak days */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('profile')}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:underline"
                >
                  {currentUser.streak > 0 && (
                    <div className="flex items-center gap-0.5 bg-orange-50 dark:bg-orange-950/25 border border-orange-100 dark:border-orange-900/40 text-orange-600 px-2 py-0.5 rounded-full">
                      <Flame className="w-3 h-3 fill-orange-500 text-orange-500 animate-pulse" />
                      <span className="text-[10px]">{currentUser.streak}d</span>
                    </div>
                  )}

                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

          </div>

        </div>

        {/* Mobile sticky sliding submenu rail */}
        {currentUser && (
          <div className="border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 lg:hidden px-4 py-1.5 flex justify-between gap-1 text-[10px] font-bold text-slate-500 overflow-x-auto">
            {[
              { id: 'map', label: 'Issue Map' },
              { id: 'report', label: 'Report' },
              { id: 'dashboard', label: 'Impact' },
              { id: 'leaderboard', label: 'Leaderboard' },
              { id: 'insights', label: 'AI Insights' },
              { id: 'official', label: 'Official' }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => navigateTo(link.id)}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  activeTab === link.id 
                    ? 'bg-blue-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-extrabold' 
                    : ''
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* MAIN VIEW CONTROLLER */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedIssueId || '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {(activeTab === 'home' || activeTab === 'login') && (
              <LandingPage
                issues={issues}
                onNavigate={(dest) => navigateTo(dest)}
                onSelectIssue={handleSelectIssue}
                currentUser={currentUser}
                onAuthSuccess={(profile) => {
                  setCurrentUser(profile);
                  if (profile.role === 'official') {
                    navigateTo('official');
                  } else {
                    navigateTo('profile');
                  }
                }}
              />
            )}

            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-xl font-sans font-black text-slate-900 dark:text-white">Hyperlocal Map Explorer</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Visually track active complaints pin points across city zones.</p>
                  </div>
                  <button 
                    onClick={() => navigateTo('report')} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm"
                  >
                    + Report New
                  </button>
                </div>
                <div className="h-[600px] rounded-3xl overflow-hidden border border-slate-150 dark:border-slate-850 relative">
                  <MapComponent
                    issues={issues}
                    onSelectIssue={handleSelectIssue}
                  />
                </div>
              </div>
            )}

            {activeTab === 'report' && (
              <ReportPage
                currentUser={currentUser}
                isOnline={isOnline}
                onIssueReported={(newI) => {
                  setIssues([newI, ...issues]);
                  fetchIssuesList();
                }}
                onNavigateToIssues={() => {
                  fetchIssuesList();
                  navigateTo('map');
                }}
              />
            )}

            {activeTab === 'dashboard' && (
              <ImpactDashboard />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardPage />
            )}

            {activeTab === 'insights' && (
              <InsightsPage />
            )}

            {activeTab === 'profile' && (
              <ProfilePage
                userProfile={currentUser}
                onRefreshProfile={async () => {
                  if (firebaseUser) {
                    const p = await getUserProfile(firebaseUser.uid);
                    setCurrentUser(p);
                  }
                }}
                onSelectIssue={handleSelectIssue}
              />
            )}

            {activeTab === 'official' && (
              <OfficialDashboard
                currentUser={currentUser}
                issues={issues}
                onRefreshIssues={fetchIssuesList}
                onSelectIssue={handleSelectIssue}
              />
            )}

            {activeTab === 'issue-detail' && selectedIssueId && (
              <IssueDetailPage
                issueId={selectedIssueId}
                currentUser={currentUser}
                onBack={() => {
                  navigateTo('map');
                }}
                onRefreshIssues={fetchIssuesList}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-850 py-8 text-center text-xs text-slate-400 mt-12 space-y-2">
        <div className="flex items-center justify-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>CivicPulse Platform Engine</span>
        </div>
        <p className="max-w-md mx-auto leading-relaxed">
          CivicPulse is an urban policy initiative supporting BBMP municipal wards. Empowering citizen reports with secure AI categorizations & priority index SLAs.
        </p>
        <p className="text-[10px] text-slate-400">
          © 2026 CivicPulse Bengaluru. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}
