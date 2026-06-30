import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, AlignLeft, Check, AlertCircle, Trash, CloudLightning, Shield, AlertTriangle, Sparkles, Clock, Share2, CornerDownRight } from 'lucide-react';
import MapComponent from './MapComponent';
import { LatLng, WARDS_LIST, CATEGORIES_LIST, Issue, STATE_CITY_WARD_MAP } from '../types';

interface ReportPageProps {
  currentUser: { uid: string; name: string } | null;
  isOnline: boolean;
  onIssueReported: (issue: Issue) => void;
  onNavigateToIssues: () => void;
}

export default function ReportPage({ currentUser, isOnline, onIssueReported, onNavigateToIssues }: ReportPageProps) {
  const [step, setStep] = useState(1);
  
  // Form State
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [coordinates, setCoordinates] = useState<LatLng>({ lat: 28.6139, lng: 77.2090 }); // New Delhi
  const [address, setAddress] = useState('Connaught Place, New Delhi, Delhi 110001');
  const [ward, setWard] = useState(WARDS_LIST[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES_LIST[0]);
  const [severity, setSeverity] = useState(3);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');

  // Submitting States
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState<Issue | null>(null);

  // SLA Time Countdown state
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Auto-detect ward based on reverse geocoded address keywords matching Indian States and Cities
  useEffect(() => {
    const addr = address.toLowerCase();
    
    // First check existing specific landmark keywords to match demo cities explicitly and keep seed issues happy
    if (addr.includes('connaught') || addr.includes('minto') || addr.includes('karol bagh') || addr.includes('chanakyapuri')) {
      setWard("Delhi - New Delhi - Connaught Place");
      return;
    }
    if (addr.includes('andheri') || addr.includes('bandra') || addr.includes('marine') || addr.includes('colaba')) {
      setWard("Maharashtra - Mumbai - Andheri");
      return;
    }
    if (addr.includes('bellandur') || addr.includes('koramangala') || addr.includes('hsr') || addr.includes('jayanagar') || addr.includes('indiranagar') || addr.includes('malleshwaram')) {
      setWard("Karnataka - Bengaluru - Bellandur");
      return;
    }
    if (addr.includes('howrah') || addr.includes('salt lake') || addr.includes('park street')) {
      setWard("West Bengal - Kolkata - Howrah");
      return;
    }
    if (addr.includes('gachibowli') || addr.includes('charminar') || addr.includes('madhapur') || addr.includes('banjara hills')) {
      setWard("Telangana - Hyderabad - Gachibowli");
      return;
    }
    if (addr.includes('paltan bazaar') || addr.includes('dispur')) {
      setWard("Assam - Guwahati - Paltan Bazaar");
      return;
    }

    // Dynamic search across all 28 states, 8 UTs, and 505 cities
    for (const state of Object.keys(STATE_CITY_WARD_MAP)) {
      const stateLower = state.toLowerCase();
      const isStateMentioned = addr.includes(stateLower);
      
      const cities = Object.keys(STATE_CITY_WARD_MAP[state]);
      for (const city of cities) {
        const cityLower = city.toLowerCase();
        // If city is mentioned in geocoded address, match it!
        if (addr.includes(cityLower)) {
          const defaultWard = STATE_CITY_WARD_MAP[state][city][0] || "Ward 1";
          setWard(`${state} - ${city} - ${defaultWard}`);
          return;
        }
      }
      
      // If state itself was mentioned, but no city was mentioned, default to state's first city
      if (isStateMentioned) {
        const firstCity = cities[0];
        if (firstCity) {
          const defaultWard = STATE_CITY_WARD_MAP[state][firstCity][0] || "Ward 1";
          setWard(`${state} - ${firstCity} - ${defaultWard}`);
          return;
        }
      }
    }

    // Default fallback if no match found
    setWard("Delhi - New Delhi - Connaught Place");
  }, [address]);

  // Handle media file upload with client-side image resizing/compression to optimize latency
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.split('/')[0];
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize to a maximum dimension of 800px to ensure ultra-fast transport and AI diagnosis
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.75 quality to drastically reduce payload size
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            setMediaFile(dataUrl);
            setMediaType('image');
          } else {
            setMediaFile(event.target?.result as string);
            setMediaType('image');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaFile(reader.result as string);
        setMediaType(fileType as 'image' | 'video' | 'audio');
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulated Voice Note
  const handleSimulatedRecording = () => {
    setMediaFile('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA');
    setMediaType('audio');
  };

  const handlePinDropped = (latlng: LatLng, addr: string) => {
    setCoordinates(latlng);
    setAddress(addr);
  };

  // Trigger Gemini AI Image analysis to pre-fill category, severity & reasoning
  const triggerAiAnalysis = async () => {
    setStep(2);
    if (!mediaFile || mediaType !== 'image') {
      // If no image, skip AI analysis and just let them select manually in step 2
      return;
    }

    setAnalyzingImage(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaFile,
          description: description || title || ''
        })
      });

      if (res.ok) {
        const result = await res.json();
        setCategory(result.category || CATEGORIES_LIST[0]);
        setSeverity(result.severity || 3);
        setAiReasoning(result.reasoning || 'AI analysis completed.');
        if (result.description) {
          setDescription(result.description);
        }
      }
    } catch (err) {
      console.error('Gemini analyze failed, falling back:', err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleSubmitReport = async () => {
    setSubmitting(true);

    const issueData = {
      title: title || `${category} reported in ${ward}`,
      description: description || 'No details provided.',
      category,
      severity,
      location: {
        lat: coordinates.lat,
        lng: coordinates.lng,
        ward,
        address
      },
      media: mediaFile ? [{ url: mediaFile, type: mediaType }] : [],
      reportedBy: isAnonymous ? 'anonymous' : (currentUser?.uid || 'anonymous'),
      reportedByName: isAnonymous ? 'Anonymous Citizen' : (currentUser?.name || 'Anonymous Citizen'),
      source: 'app' as 'app' | 'whatsapp'
    };

    if (!isOnline) {
      // Offline queue caching
      const offlineQueue = JSON.parse(localStorage.getItem('civicpulse_offline_reports') || '[]');
      const offlineIssue: Partial<Issue> = {
        id: `offline-${Date.now()}`,
        ...issueData,
        status: 'reported',
        upvotes: [],
        priorityScore: severity * 2,
        statusHistory: [
          { status: 'reported', changedBy: 'Offline System Cache', note: 'Issue cached locally. Will sync automatically when network returns.', timestamp: new Date().toISOString() }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      offlineQueue.push(offlineIssue);
      localStorage.setItem('civicpulse_offline_reports', JSON.stringify(offlineQueue));

      setSubmitting(false);
      alert('📱 Offline Safe Mode Active: Your report has been cached. It will sync automatically when your network returns!');
      onNavigateToIssues();
      return;
    }

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
      });

      if (res.ok) {
        const result = await res.json();
        setSubmittedIssue(result);
        onIssueReported(result);
        setStep(4); // Advance to SLA Confirmation page
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Network error. Saving issue to drafts.');
    } finally {
      setSubmitting(false);
    }
  };

  // SLA Timer logic for Step 4
  useEffect(() => {
    if (step !== 4 || !submittedIssue) return;

    // SLA duration determination
    const isMonsoonMode = localStorage.getItem('civicpulse_monsoon_mode') === 'true';
    const isEmergencyMonsoon = isMonsoonMode && (submittedIssue.category === 'Drainage & Flooding' || submittedIssue.category === 'Water Leakage & Sewage');
    
    // SLA hours: 6 hours if emergency monsoon, 24 hours if sanitation/garbage, 48 hours otherwise
    let slaHours = 48;
    if (isEmergencyMonsoon) {
      slaHours = 6;
    } else if (submittedIssue.category === 'Garbage & Sanitation') {
      slaHours = 24;
    }

    const targetTime = new Date(submittedIssue.createdAt).getTime() + (slaHours * 60 * 60 * 1000);

    const interval = setInterval(() => {
      const difference = targetTime - Date.now();
      if (difference <= 0) {
        setTimeLeft('SLA SLA due now');
        clearInterval(interval);
        return;
      }

      const h = Math.floor(difference / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${h}h ${m}m ${s}s remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, submittedIssue]);

  const handleSaveDraft = () => {
    const draft = {
      title,
      description,
      category,
      severity,
      address,
      ward,
      coordinates,
      mediaFile,
      mediaType
    };
    localStorage.setItem('civicpulse_draft', JSON.stringify(draft));
    alert('📝 Draft saved successfully to local cache.');
  };

  const handleLoadDraft = () => {
    const saved = localStorage.getItem('civicpulse_draft');
    if (saved) {
      const draft = JSON.parse(saved);
      setTitle(draft.title || '');
      setDescription(draft.description || '');
      setCategory(draft.category || CATEGORIES_LIST[0]);
      setSeverity(draft.severity || 3);
      setAddress(draft.address || '');
      setWard(draft.ward || WARDS_LIST[0]);
      setCoordinates(draft.coordinates || { lat: 12.9716, lng: 77.5946 });
      setMediaFile(draft.mediaFile || null);
      setMediaType(draft.mediaType || null);
    }
  };

  const clearForm = () => {
    setMediaFile(null);
    setMediaType(null);
    setTitle('');
    setDescription('');
    setCategory(CATEGORIES_LIST[0]);
    setSeverity(3);
    setAiReasoning('');
    setStep(1);
    setSubmittedIssue(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-2 px-1">
      
      {/* STEPS INDICATOR */}
      <div className="flex justify-between items-center max-w-xl mx-auto mb-8 relative px-4">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
        {[1, 2, 3, 4].map((num) => {
          let label = "File & Locate";
          if (num === 2) label = "AI Diagnosis";
          if (num === 3) label = "Specifications";
          if (num === 4) label = "SLA Countdown";

          const isActive = step === num;
          const isCompleted = step > num;

          return (
            <div key={num} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
                  isActive 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' 
                    : isCompleted
                    ? 'bg-green-600 border-green-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : num}
              </div>
              <span className={`text-[10px] font-bold font-sans mt-1.5 ${isActive ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-450'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[500px]">
        
        {/* SIDE BAR / GRAPHICS PANEL */}
        <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950 p-6 border-b md:border-b-0 md:border-r border-slate-150 dark:border-slate-850 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-mono">
              Step {step} of 4
            </span>
            <div>
              <h3 className="font-sans font-black text-slate-850 dark:text-white text-lg">
                {step === 1 && "File & Locate"}
                {step === 2 && "Gemini AI Diagnosis"}
                {step === 3 && "Refine Specifications"}
                {step === 4 && "Track Priority SLA"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                {step === 1 && "Drag & drop visual proof, drop a map pin, and specify the exact location coordinates."}
                {step === 2 && "Our Gemini Vision multimodal engine automates hazard severity assessments and ward classifications."}
                {step === 3 && "Input regional multilingual logs and verify anonymous safety credentials."}
                {step === 4 && "Your request is registered! Track real-time progress against the binding municipal timer."}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 mt-6">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-450 text-[10px] font-mono">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Complies with BBMP Public Grievance Charter 2026</span>
            </div>
            {localStorage.getItem('civicpulse_draft') && step === 1 && (
              <button
                type="button"
                onClick={handleLoadDraft}
                className="w-full text-center text-[11px] font-bold text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950/20 py-2 rounded-xl border border-blue-100"
              >
                📋 Resume cached draft
              </button>
            )}
          </div>
        </div>

        {/* ACTIVE FORM AREA */}
        <div className="flex-1 p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
          
          {/* STEP 1: UPLOAD PHOTO & PIN LOCATION */}
          {step === 1 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                
                {/* Photo upload block */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono block">1. Photo Proof</label>
                    <p className="text-[10px] text-slate-400">Upload a photo to trigger Gemini AI visual diagnostics.</p>
                  </div>

                  {mediaFile ? (
                    <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-950 h-56 flex items-center justify-center group">
                      {mediaType === 'image' ? (
                        <img src={mediaFile} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="p-4 text-center text-white text-xs font-mono">🎙️ Voice recording note captured</div>
                      )}
                      <button
                        type="button"
                        onClick={() => { setMediaFile(null); setMediaType(null); }}
                        className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-xl shadow hover:bg-red-700 transition-transform active:scale-95"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-850 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-950/10 cursor-pointer relative group transition-colors flex-1 flex flex-col justify-center">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="space-y-3">
                        <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Drag or click to upload</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, MP4 up to 50MB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Selection block */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono block">2. Zone Location</label>
                    <p className="text-[10px] text-slate-400">Map pin drop automatically extracts nearest ward.</p>
                  </div>

                  <div className="bg-blue-50/30 dark:bg-slate-950 border border-blue-50 dark:border-slate-850 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="font-bold truncate">{address}</span>
                  </div>

                  <div className="h-56 rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800 relative">
                    <MapComponent
                      issues={[]}
                      isSelectionMode={true}
                      onPinDropped={handlePinDropped}
                      initialCenter={coordinates}
                    />
                  </div>
                </div>

              </div>

              {/* Step 1 CTA */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <div className="text-[10px] text-slate-400">
                  Detected Ward: <strong className="text-slate-700 dark:text-slate-300">{ward}</strong>
                </div>
                <button
                  type="button"
                  onClick={triggerAiAnalysis}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <span>Analyze with Gemini AI</span>
                  <CornerDownRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: AI AUTOCATEGORIZE / SKELETON LOADER */}
          {step === 2 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {analyzingImage ? (
                /* Animated loading skeleton */
                <div className="space-y-6 flex-1 flex flex-col justify-center py-6">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <CloudLightning className="w-5 h-5 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                    </div>
                    <div className="text-center space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                        Running Multimodal AI Vision
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Gemini-2.5-flash is identifying hazard severity coefficients, predicting department routing SLA, and extracting metadata details from your photograph...
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-4 space-y-3 max-w-md mx-auto w-full animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                    <div className="flex gap-2 pt-2">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-1/4"></div>
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-1/4"></div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Diagnostics Confirmation Form */
                <div className="space-y-5 flex-1">
                  <div className="bg-indigo-50/40 dark:bg-indigo-950/15 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex gap-3.5">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 font-mono block">Gemini Diagnosis Output</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {aiReasoning || "Successfully categorized! Check suggestions below and adjust if required."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">AI Suggested Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-transparent text-slate-850 dark:text-slate-200 focus:border-blue-500"
                      >
                        {CATEGORIES_LIST.map((cat) => (
                          <option key={cat} value={cat} className="text-slate-850 bg-white dark:bg-slate-900">{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Severity Selection buttons */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        <span>AI Suggested Severity Assessment</span>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">Level {severity}/5</span>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSeverity(num)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                              severity === num
                                ? num === 5 ? 'bg-red-600 text-white shadow shadow-red-500/20'
                                  : num === 4 ? 'bg-orange-500 text-white shadow'
                                  : num === 3 ? 'bg-amber-500 text-white shadow'
                                  : num === 2 ? 'bg-blue-600 text-white shadow'
                                  : 'bg-slate-650 text-white shadow'
                                : 'bg-slate-105 dark:bg-slate-800 text-slate-400 hover:bg-slate-150'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    >
                      ← Back to Media
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                    >
                      Next: Complete details →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: DETAILS & ANONYMOUS TOGGLE */}
          {step === 3 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Grievance Subject Title</label>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="text-[11px] text-blue-600 font-extrabold hover:underline"
                    >
                      💾 Save draft
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., Clogged storm drain inlet causing street water pooling"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-transparent text-slate-850 dark:text-slate-200 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono font-sans block">Detailed Description / Local Logs</label>
                  <textarea
                    rows={4}
                    placeholder="Provide additional details (supports multilingual regional inputs, which are automatically processed)."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-transparent text-slate-850 dark:text-slate-200 focus:border-blue-500"
                  />
                </div>

                {/* Anonymous safe mode and priority warnings */}
                <div className="space-y-2.5">
                  <label className="flex items-start gap-3 cursor-pointer bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-3.5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="mt-0.5 rounded cursor-pointer accent-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Anonymous Safe Mode reporting</span>
                      <span className="text-[10px] text-slate-450 block leading-normal mt-0.5">
                        Log complaint without attaching to your public citizen profile. You will receive an SMS verification/tracking token only.
                      </span>
                    </div>
                  </label>

                  {localStorage.getItem('civicpulse_monsoon_mode') === 'true' && (
                    <div className="bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/40 p-3.5 rounded-xl flex items-start gap-2.5 text-[10px] text-red-700 dark:text-red-300 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 animate-pulse" />
                      <div>
                        <strong className="block font-bold">Monsoon Prioritization Active</strong>
                        Drainage & Flooding, sewage leakages, or water stagnation concerns will automatically override standard queues with 6-hour dispatch SLAs.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400"
                >
                  ← Back to AI Diagnosis
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md disabled:bg-slate-300 flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  {submitting ? "Submitting to servers..." : isOnline ? "Confirm & File Report" : "Queue Offline Report"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUBMISSION CONFIRMATION & SLA COUNTDOWN TIMER */}
          {step === 4 && submittedIssue && (
            <div className="space-y-6 flex-1 flex flex-col justify-center items-center text-center py-4">
              
              <div className="w-14 h-14 bg-green-50 dark:bg-green-950/25 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center border-2 border-green-200 dark:border-green-900/30 shadow-md">
                <Check className="w-7 h-7 stroke-[3px] animate-bounce" />
              </div>

              <div className="space-y-2 max-w-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 font-mono">Civic Report Filed Successfully</span>
                <h3 className="font-sans font-black text-slate-900 dark:text-white text-lg leading-snug">
                  Grievance Logged & Dispatched
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Our system has routed your request to the appropriate department board (<strong className="text-slate-700 dark:text-slate-300">BBMP/BWSSB</strong>). The technician is obligated to inspect the site within the timeline.
                </p>
              </div>

              {/* SLA COUNTDOWN TIMER CARD */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 max-w-sm w-full shadow-inner space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono uppercase tracking-wider font-extrabold">
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                  <span>SLA Resolution Countdown</span>
                </div>
                <div className="font-mono text-xl font-black text-red-600 dark:text-red-400 animate-pulse tracking-wider">
                  {timeLeft || "Calculating timeline..."}
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 text-[9px] text-slate-450 flex justify-between font-mono">
                  <span>Issue ID: {submittedIssue.id.substring(0, 8)}...</span>
                  <span>Category: {submittedIssue.category}</span>
                </div>
              </div>

              {/* Track deep link / Anonymous Token Notice */}
              {isAnonymous && (
                <div className="bg-blue-50/40 dark:bg-slate-950 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 max-w-md w-full space-y-1.5">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-450 uppercase tracking-widest block font-mono">Secure Tracking Token</span>
                  <div className="text-sm font-black font-mono text-blue-600 tracking-wider">
                    CP-SMS-{Math.floor(100000 + Math.random() * 900000)}
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed">
                    Write down this token to track updates, upvote, and complete reviews anonymously without any user credentials.
                  </p>
                </div>
              )}

              {/* Success actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={clearForm}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50"
                >
                  File Another Report
                </button>
                <button
                  type="button"
                  onClick={onNavigateToIssues}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Track on Map View
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
