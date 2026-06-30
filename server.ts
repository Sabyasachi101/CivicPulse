import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './src/lib/firebase.js'; // Use .js extension for compiled ESM
import { SEED_ISSUES } from './src/lib/seedData.js';
import { Issue, Insight, Notification, Comment, WARDS_LIST } from './src/types.js';
import { analyzeIssueImage, translateToEnglish, generatePredictiveInsights } from './src/lib/geminiServer.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper: Haversine distance in meters
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Helper: Get a curated set of active wards to optimize dashboard, stats, and leaderboard processing
const DEMO_WARDS = [
  "Delhi - New Delhi - Connaught Place",
  "Delhi - New Delhi - Karol Bagh",
  "Delhi - New Delhi - Chanakyapuri",
  "Maharashtra - Mumbai - Andheri",
  "Maharashtra - Mumbai - Bandra",
  "Maharashtra - Mumbai - Colaba",
  "Maharashtra - Pune - Hinjawadi",
  "Karnataka - Bengaluru - Malleshwaram",
  "Karnataka - Bengaluru - Indiranagar",
  "Karnataka - Bengaluru - Koramangala",
  "Karnataka - Bengaluru - Bellandur",
  "Karnataka - Bengaluru - HSR Layout",
  "Karnataka - Bengaluru - Jayanagar",
  "West Bengal - Kolkata - Salt Lake",
  "West Bengal - Kolkata - Howrah",
  "West Bengal - Kolkata - Park Street",
  "Telangana - Hyderabad - Gachibowli",
  "Telangana - Hyderabad - Madhapur",
  "Telangana - Hyderabad - Banjara Hills",
  "Assam - Guwahati - Paltan Bazaar",
  "Assam - Guwahati - Dispur"
];

function getCuratedWards(allIssues: Issue[]): string[] {
  const wards = new Set(DEMO_WARDS);
  allIssues.forEach(i => {
    if (i.location && i.location.ward) {
      wards.add(i.location.ward);
    }
  });
  return Array.from(wards);
}

// Function: Clear all previous issues and do NOT perform auto-seeding
async function autoSeedDatabase() {
  try {
    const issuesCol = collection(db, 'issues');
    const issuesSnap = await getDocs(issuesCol);
    console.log(`Clearing all existing ${issuesSnap.size} issues from database to ensure fresh slate...`);
    for (const d of issuesSnap.docs) {
      await deleteDoc(doc(db, 'issues', d.id));
    }
    console.log('Database cleared of all previous issue data.');

    // Also clear insights
    const insightsCol = collection(db, 'insights');
    const insightsSnap = await getDocs(insightsCol);
    console.log(`Clearing all existing ${insightsSnap.size} insights from database...`);
    for (const d of insightsSnap.docs) {
      await deleteDoc(doc(db, 'insights', d.id));
    }
    console.log('Database cleared of all previous insights data.');
  } catch (error) {
    console.error('Clearing database failed:', error);
  }
}

// REST Endpoint: Manual Seeding Trigger (now serves to clear database instead)
app.post('/api/seed', async (req, res) => {
  try {
    const issuesCol = collection(db, 'issues');
    const issuesSnap = await getDocs(issuesCol);
    
    // Clear existing
    for (const d of issuesSnap.docs) {
      await deleteDoc(doc(db, 'issues', d.id));
    }

    // Also clear insights
    const insightsCol = collection(db, 'insights');
    const insightsSnap = await getDocs(insightsCol);
    for (const d of insightsSnap.docs) {
      await deleteDoc(doc(db, 'insights', d.id));
    }

    res.json({ message: 'All issues and insights cleared successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/issues (Public list, in-memory filterable to avoid firestore index compilation locks)
app.get('/api/issues', async (req, res) => {
  try {
    const { ward, category, status, severity, query: searchQuery } = req.query;
    const colRef = collection(db, 'issues');
    const snap = await getDocs(colRef);
    let issues = snap.docs.map(doc => doc.data() as Issue);

    // Filter results
    if (ward) {
      issues = issues.filter(i => i.location.ward === ward);
    }
    if (category) {
      issues = issues.filter(i => i.category === category);
    }
    if (status) {
      issues = issues.filter(i => i.status === status);
    }
    if (severity) {
      issues = issues.filter(i => i.severity === Number(severity));
    }
    if (searchQuery) {
      const q = (searchQuery as string).toLowerCase();
      issues = issues.filter(
        i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }

    // Sort by priorityScore descending, then by createdAt descending
    issues.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json(issues);
  } catch (error: any) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/official/issues (Role official)
app.get('/api/official/issues', async (req, res) => {
  try {
    const colRef = collection(db, 'issues');
    const snap = await getDocs(colRef);
    const issues = snap.docs.map(doc => doc.data() as Issue);
    res.json(issues);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analyze (Call Gemini Vision to analyze photo and return tags/metadata)
app.post('/api/analyze', async (req, res) => {
  try {
    const { mediaFile, description } = req.body;
    if (!mediaFile || !mediaFile.startsWith('data:')) {
      return res.status(400).json({ error: 'Valid mediaFile base64 data URI is required.' });
    }

    const parts = mediaFile.split(',');
    const mimeType = mediaFile.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
    const base64Data = parts[1];

    console.log('Calling Gemini API for photo analysis...');
    const aiResult = await analyzeIssueImage(base64Data, mimeType, description || '');
    res.json(aiResult);
  } catch (err: any) {
    console.error('Gemini analyze endpoint failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/issues (Auth optional or anonymous reporting)
app.post('/api/issues', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      severity, 
      location, 
      media, 
      reportedBy, 
      reportedByName,
      source 
    } = req.body;

    const now = new Date().toISOString();
    let finalCategory = category || 'Others';
    let finalSeverity = Number(severity) || 3;
    let finalDescription = description || '';
    let aiReasoning = '';

    // If there's an image base64, call Gemini Vision
    const imageMedia = media?.find((m: any) => m.type === 'image' && m.url.startsWith('data:'));
    if (imageMedia) {
      const parts = imageMedia.url.split(',');
      const mimeType = imageMedia.url.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
      const base64Data = parts[1];

      try {
        console.log('Calling Gemini API for photo categorization & severity...');
        const aiResult = await analyzeIssueImage(base64Data, mimeType, description || title || '');
        finalCategory = aiResult.category;
        finalSeverity = aiResult.severity;
        finalDescription = aiResult.description;
        aiReasoning = aiResult.reasoning;
      } catch (err) {
        console.error('Gemini Vision processing failed:', err);
      }
    } else {
      // If there's regional input, translate to English
      if (description) {
        finalDescription = await translateToEnglish(description);
      }
    }

    // Duplicate detection: check same category, within 50 meters, and reported within 48 hours
    const colRef = collection(db, 'issues');
    const snap = await getDocs(colRef);
    const existingIssues = snap.docs.map(doc => doc.data() as Issue);
    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;

    let duplicateOfId: string | undefined;

    for (const ex of existingIssues) {
      if (ex.category === finalCategory && !ex.duplicateOf) {
        const exTime = new Date(ex.createdAt).getTime();
        if (exTime > fortyEightHoursAgo) {
          const dist = getDistanceMeters(
            location.lat, 
            location.lng, 
            ex.location.lat, 
            ex.location.lng
          );
          if (dist <= 50) {
            duplicateOfId = ex.id;
            break;
          }
        }
      }
    }

    // Calculate priority score: priorityScore = (severity * 2) + upvotes + (days_open * 0.5)
    // For new issues, days_open is 0 and upvotes is 0, so base score is severity * 2
    const priorityScore = finalSeverity * 2;

    const docRef = doc(collection(db, 'issues'));
    const newIssue: Issue = {
      id: docRef.id,
      title: title || `${finalCategory} Reported in ${location.ward}`,
      description: finalDescription || 'No description provided.',
      category: finalCategory,
      severity: finalSeverity,
      status: 'reported',
      location,
      media: media || [],
      reportedBy: reportedBy || 'anonymous',
      reportedByName: reportedByName || 'Anonymous Citizen',
      upvotes: [],
      priorityScore,
      source: source || 'app',

      statusHistory: [
        {
          status: 'reported',
          changedBy: reportedByName || 'Citizen',
          changedByUid: reportedBy,
          note: duplicateOfId 
            ? `Duplicate issue merged with Master ID: ${duplicateOfId}` 
            : 'Initial issue reported.',
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    if (duplicateOfId) {
      newIssue.duplicateOf = duplicateOfId;
    }

    await setDoc(docRef, newIssue);

    // Gamification rewards points
    if (reportedBy && reportedBy !== 'anonymous') {
      try {
        const userRef = doc(db, 'users', reportedBy);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const pointsEarned = 10; // +10 points for reporting
          const currentPoints = (userData.points || 0) + pointsEarned;
          
          const newBadges = [...(userData.badges || [])];
          if (currentPoints >= 100 && !newBadges.includes('verified_contributor')) {
            newBadges.push('verified_contributor');
          }

          // Streak update
          let currentStreak = userData.streak || 1;
          const lastReported = userData.lastReportedDate;
          const todayStr = new Date().toISOString().split('T')[0];
          
          if (lastReported) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastReported === yesterdayStr) {
              currentStreak += 1;
            } else if (lastReported !== todayStr) {
              currentStreak = 1;
            }
          }

          if (currentStreak >= 10 && !newBadges.includes('streak_resolver')) {
            newBadges.push('streak_resolver');
          }

          await updateDoc(userRef, {
            points: currentPoints,
            badges: newBadges,
            streak: currentStreak,
            lastReportedDate: todayStr
          });

          // Log Notification
          const notifRef = doc(collection(db, 'notifications'));
          const notif: Notification = {
            id: notifRef.id,
            userId: reportedBy,
            message: `Congratulations! You earned +10 impact points for reporting. Your total is now ${currentPoints} points.`,
            type: 'status_change',
            read: false,
            issueId: docRef.id,
            createdAt: now
          };
          await setDoc(notifRef, notif);
        }
      } catch (err) {
        console.error('Failed to reward reporter gamification points:', err);
      }
    }

    res.status(201).json(newIssue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/issues/:id
app.get('/api/issues/:id', async (req, res) => {
  try {
    const issueRef = doc(db, 'issues', req.params.id);
    const snap = await getDoc(issueRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(snap.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/issues/:id/status (Official only)
app.patch('/api/issues/:id/status', async (req, res) => {
  try {
    const { status, changedBy, note, assignedTo, department, slaDue, resolvedProofUrl } = req.body;
    const now = new Date().toISOString();

    const issueRef = doc(db, 'issues', req.params.id);
    const snap = await getDoc(issueRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const currentIssue = snap.data() as Issue;
    const oldStatus = currentIssue.status;

    const updatedFields: Partial<Issue> = {
      status,
      updatedAt: now
    };

    if (assignedTo !== undefined) updatedFields.assignedTo = assignedTo;
    if (department !== undefined) updatedFields.department = department;
    if (slaDue !== undefined) updatedFields.slaDue = slaDue;
    if (resolvedProofUrl !== undefined) updatedFields.resolvedProofUrl = resolvedProofUrl;

    // Calculate priorityScore
    // priorityScore = (severity * 2) + upvotes + (days_open * 0.5)
    const daysOpen = Math.max(0, (Date.now() - new Date(currentIssue.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const upvotesCount = currentIssue.upvotes ? currentIssue.upvotes.length : 0;
    updatedFields.priorityScore = (currentIssue.severity * 2) + upvotesCount + (daysOpen * 0.5);

    const newHistoryLog = {
      status,
      changedBy: changedBy || 'Municipal Official',
      note: note || `Status updated from ${oldStatus} to ${status}.`,
      timestamp: now
    };

    updatedFields.statusHistory = [...(currentIssue.statusHistory || []), newHistoryLog];

    await updateDoc(issueRef, updatedFields);

    // Gamification points trigger if status is resolved or closed
    const reporterId = currentIssue.reportedBy;
    if (reporterId && reporterId !== 'anonymous' && (status === 'resolved' || status === 'closed') && oldStatus !== 'resolved' && oldStatus !== 'closed') {
      try {
        const userRef = doc(db, 'users', reporterId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // +20 for resolved issue, +15 if resolved proof uploaded
          const pointsEarned = 20 + (resolvedProofUrl ? 15 : 0);
          const currentPoints = (userData.points || 0) + pointsEarned;

          const newBadges = [...(userData.badges || [])];
          if (currentPoints >= 100 && !newBadges.includes('verified_contributor')) {
            newBadges.push('verified_contributor');
          }
          if (newBadges.length >= 3 && !newBadges.includes('neighborhood_hero')) {
            newBadges.push('neighborhood_hero');
          }

          await updateDoc(userRef, {
            points: currentPoints,
            badges: newBadges
          });

          // Log Notification for user
          const notifRef = doc(collection(db, 'notifications'));
          const notif: Notification = {
            id: notifRef.id,
            userId: reporterId,
            message: `Awesome news! Your reported issue "${currentIssue.title}" has been marked as ${status}. You earned +${pointsEarned} points!`,
            type: 'status_change',
            read: false,
            issueId: req.params.id,
            createdAt: now
          };
          await setDoc(notifRef, notif);
        }
      } catch (err) {
        console.error('Failed to update gamification points on resolution:', err);
      }
    }

    res.json({ ...currentIssue, ...updatedFields });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/issues/:id/upvote (With geofence checks)
app.post('/api/issues/:id/upvote', async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required to upvote.' });
    }

    const issueRef = doc(db, 'issues', req.params.id);
    const snap = await getDoc(issueRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const issue = snap.data() as Issue;
    const upvotes = issue.upvotes || [];

    if (upvotes.includes(userId)) {
      return res.status(400).json({ error: 'You have already upvoted this issue.' });
    }

    // Geofence check: user must be within 500 meters
    if (lat && lng) {
      const dist = getDistanceMeters(lat, lng, issue.location.lat, issue.location.lng);
      if (dist > 500) {
        return res.status(403).json({ 
          error: `Geofence check failed. You must be within 500 meters of the issue to verify or upvote it (Current distance: ${Math.round(dist)}m).` 
        });
      }
    }

    const updatedUpvotes = [...upvotes, userId];
    
    // Recalculate priorityScore
    const daysOpen = Math.max(0, (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const priorityScore = (issue.severity * 2) + updatedUpvotes.length + (daysOpen * 0.5);

    await updateDoc(issueRef, {
      upvotes: updatedUpvotes,
      priorityScore
    });

    // Reward points to the upvoter (+5 points for verifying a neighborhood issue)
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentPoints = (userData.points || 0) + 5;
        const newBadges = [...(userData.badges || [])];
        if (currentPoints >= 100 && !newBadges.includes('verified_contributor')) {
          newBadges.push('verified_contributor');
        }
        await updateDoc(userRef, {
          points: currentPoints,
          badges: newBadges
        });
      }
    } catch (err) {
      console.log('Error adding verification reward points:', err);
    }

    res.json({ success: true, upvotes: updatedUpvotes, priorityScore });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/map/clusters
app.get('/api/map/clusters', async (req, res) => {
  try {
    const colRef = collection(db, 'issues');
    const snap = await getDocs(colRef);
    const issues = snap.docs.map(doc => {
      const d = doc.data() as Issue;
      return {
        id: d.id,
        title: d.title,
        category: d.category,
        severity: d.severity,
        status: d.status,
        location: d.location,
        priorityScore: d.priorityScore
      };
    });
    res.json(issues);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    // Citizen leaderboard
    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    const citizens = usersSnap.docs
      .map(doc => doc.data())
      .filter(u => u.role === 'citizen')
      .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
      .slice(0, 10);

    // Ward leaderboard - compute PulseScore™ for each ward
    const issuesCol = collection(db, 'issues');
    const issuesSnap = await getDocs(issuesCol);
    const allIssues = issuesSnap.docs.map(doc => doc.data() as Issue);

    const wardsScores = getCuratedWards(allIssues).map(ward => {
      const wardIssues = allIssues.filter(i => i.location.ward === ward);
      const totalCount = wardIssues.length;
      const openIssues = wardIssues.filter(i => i.status !== 'resolved' && i.status !== 'closed');
      const resolvedIssues = wardIssues.filter(i => i.status === 'resolved' || i.status === 'closed');
      
      const avgSeverity = openIssues.length > 0 
        ? openIssues.reduce((sum, i) => sum + (i.severity || 3), 0) / openIssues.length 
        : 0;
      
      let pulseScore = 100;
      pulseScore -= openIssues.length * 4;
      pulseScore -= Math.round(avgSeverity * 6);
      pulseScore = Math.max(10, Math.min(100, pulseScore));

      return {
        ward,
        totalIssues: totalCount,
        resolvedIssues: resolvedIssues.length,
        openIssues: openIssues.length,
        pulseScore
      };
    }).sort((a, b) => b.pulseScore - a.pulseScore);

    res.json({ citizens, wards: wardsScores });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leaderboard/reset
app.post('/api/leaderboard/reset', async (req, res) => {
  try {
    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    const updatedUsers = [];

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      if (data.role === 'citizen') {
        const userRef = doc(db, 'users', userDoc.id);
        await updateDoc(userRef, {
          points: 0,
          badges: [],
          streak: 0
        });
        updatedUsers.push(userDoc.id);
      }
    }

    res.json({
      success: true,
      message: `Reset leaderboard for ${updatedUsers.length} citizen(s).`,
      count: updatedUsers.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/insights (Predictive ward insights, refreshed on request or dynamically generated)
app.get('/api/insights', async (req, res) => {
  try {
    const { refresh } = req.query;
    const issuesCol = collection(db, 'issues');
    const issuesSnap = await getDocs(issuesCol);
    const allIssues = issuesSnap.docs.map(doc => doc.data() as Issue);

    const insightsCol = collection(db, 'insights');
    const insightsSnap = await getDocs(insightsCol);
    
    let insightsList: Insight[] = [];

    if (refresh === 'true') {
      console.log('Force refresh requested. Clearing previous insights...');
      for (const d of insightsSnap.docs) {
        await deleteDoc(doc(db, 'insights', d.id));
      }
    } else {
      insightsList = insightsSnap.docs.map(doc => doc.data() as Insight);
    }

    // If insights collection is empty or out of sync, let's auto-generate them!
    if (insightsList.length === 0) {
      console.log('Generating AI ward insights dynamically...');
      const curatedWards = getCuratedWards(allIssues);
      for (const ward of curatedWards) {
        const wardIssues = allIssues.filter(i => i.location && i.location.ward === ward);
        
        const aiInsight = await generatePredictiveInsights(ward, wardIssues);
        const insightRef = doc(collection(db, 'insights'));
        const newInsight: Insight = {
          id: insightRef.id,
          ward,
          summary: aiInsight.summary,
          generatedAt: new Date().toISOString(),
          issueCount: wardIssues.length,
          topCategory: aiInsight.topCategory,
          pulseScore: aiInsight.pulseScore
        };

        await setDoc(insightRef, newInsight);
        insightsList.push(newInsight);
      }
    }

    res.json(insightsList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const colRef = collection(db, 'issues');
    const snap = await getDocs(colRef);
    const issues = snap.docs.map(doc => doc.data() as Issue);

    const total = issues.length;
    const resolved = issues.filter(i => i && (i.status === 'resolved' || i.status === 'closed')).length;
    const pending = total - resolved;

    // Avg resolution time calculation (simulated in days based on statusHistory)
    let totalResolutionTimeDays = 0;
    let resolvedCount = 0;
    
    issues.forEach(i => {
      if (i && (i.status === 'resolved' || i.status === 'closed')) {
        const history = i.statusHistory || [];
        const resolvedHistory = history.find(h => h && h.status === 'resolved');
        if (resolvedHistory && i.createdAt) {
          const hours = (new Date(resolvedHistory.timestamp).getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60);
          totalResolutionTimeDays += hours / 24;
          resolvedCount++;
        }
      }
    });

    const avgResolutionTime = resolvedCount > 0 
      ? Number((totalResolutionTimeDays / resolvedCount).toFixed(1)) 
      : 0; // standard fallback

    // Category breakdown
    const categoryCounts: { [key: string]: number } = {};
    issues.forEach(i => {
      if (i) {
        const cat = i.category || 'Other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    });

    // Ward analysis table
    const wardStats = getCuratedWards(issues).map(ward => {
      const wardIssues = issues.filter(i => i && i.location && i.location.ward === ward);
      const resCount = wardIssues.filter(i => i && (i.status === 'resolved' || i.status === 'closed')).length;
      return {
        ward,
        total: wardIssues.length,
        resolved: resCount,
        pending: wardIssues.length - resCount,
        resolutionRate: wardIssues.length > 0 ? Math.round((resCount / wardIssues.length) * 100) : 100
      };
    });

    // Trend lines last 12 weeks calculated strictly from actual database timestamps
    const now = new Date();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    const trendData = Array.from({ length: 12 }).map((_, idx) => {
      const weekNum = idx + 1;
      const endTime = new Date(now.getTime() - (12 - weekNum) * oneWeekMs);
      const startTime = new Date(endTime.getTime() - oneWeekMs);

      const reported = issues.filter(i => {
        if (!i || !i.createdAt) return false;
        const createdDate = new Date(i.createdAt);
        return createdDate >= startTime && createdDate < endTime;
      }).length;

      const resolvedCountForTrend = issues.filter(i => {
        if (!i) return false;
        const history = i.statusHistory || [];
        const resolvedHistory = history.find(h => h && (h.status === 'resolved' || h.status === 'closed'));
        if (!resolvedHistory) return false;
        const resolvedDate = new Date(resolvedHistory.timestamp);
        return resolvedDate >= startTime && resolvedDate < endTime;
      }).length;

      return {
        week: `Wk ${weekNum}`,
        reported,
        resolved: resolvedCountForTrend
      };
    });

    res.json({
      total,
      resolved,
      pending,
      avgResolutionTime,
      categoryCounts,
      wardStats,
      trendData
    });
  } catch (error: any) {
    console.error('Error in /api/dashboard/stats endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/webhook/whatsapp (Twilio Whatsapp signature check stub)
app.post('/api/webhook/whatsapp', async (req, res) => {
  try {
    const { Body, From, Latitude, Longitude } = req.body;
    console.log('Incoming WhatsApp message:', Body, 'from:', From);

    const now = new Date().toISOString();
    const ward = 'North Zone - New Delhi'; // fallback ward

    // Parse keywords for category
    const lowerBody = (Body || '').toLowerCase();
    let category = 'Others';
    if (lowerBody.includes('pothole') || lowerBody.includes('road')) {
      category = 'Pothole & Roads';
    } else if (lowerBody.includes('garbage') || lowerBody.includes('waste')) {
      category = 'Garbage & Sanitation';
    } else if (lowerBody.includes('water') || lowerBody.includes('leak')) {
      category = 'Water Leakage & Sewage';
    } else if (lowerBody.includes('light') || lowerBody.includes('electricity')) {
      category = 'Streetlight & Electricity';
    }

    const docRef = doc(collection(db, 'issues'));
    const whatsappIssue: Issue = {
      id: docRef.id,
      title: `WhatsApp: ${category} Report`,
      description: Body || 'Reported via WhatsApp bot.',
      category,
      severity: 3,
      status: 'reported',
      location: {
        lat: Latitude ? Number(Latitude) : 28.6139,
        lng: Longitude ? Number(Longitude) : 77.2090,
        ward,
        address: 'WhatsApp Dropped Location'
      },
      media: [],
      reportedBy: 'whatsapp',
      reportedByName: `WhatsApp Citizen (${From || 'Anonymous'})`,
      upvotes: [],
      priorityScore: 6,
      source: 'whatsapp',
      statusHistory: [
        {
          status: 'reported',
          changedBy: 'WhatsApp Bot',
          note: 'Issue created with source WhatsApp. Location low confidence flag set.',
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    await setDoc(docRef, whatsappIssue);

    res.type('text/xml');
    res.send(`
      <Response>
        <Message>
          Namaste! We have received your civic report. Issue ID is *${docRef.id}*. 
          Track progress live here: http://localhost:3000/issues/${docRef.id}
        </Message>
      </Response>
    `);
  } catch (err: any) {
    console.error('WhatsApp webhook error:', err);
    res.status(500).send('Error logging WhatsApp complaint.');
  }
});

// Seed DB on start
startServer();

async function startServer() {
  await autoSeedDatabase();

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
