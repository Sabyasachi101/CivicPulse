import React, { useState } from 'react';
import { loginWithGoogle, registerWithEmail } from '../lib/firebase';
import { UserProfile, UserRole, WARDS_LIST, STATE_CITY_WARD_MAP } from '../types';
import { LogIn, Mail } from 'lucide-react';

interface LoginPageProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function LoginPage({ onAuthSuccess }: LoginPageProps) {
  // Sign up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  
  // Hierarchical location state
  const [selectedState, setSelectedState] = useState('Delhi');
  const [selectedCity, setSelectedCity] = useState('New Delhi');
  const [selectedWardName, setSelectedWardName] = useState('Connaught Place');

  // General loading
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await loginWithGoogle();
      if (result) {
        onAuthSuccess(result.profile);
      }
    } catch (err: any) {
      setErrorMsg(
        'Google popup was blocked or failed. Please use the "Email SignUp" form below to explore the app instantly inside the preview iframe!'
      );
    } finally {
      setLoading(false);
    }
  };

  const availableStates = Object.keys(STATE_CITY_WARD_MAP);
  const availableCities = Object.keys(STATE_CITY_WARD_MAP[selectedState] || {});
  const availableWards = STATE_CITY_WARD_MAP[selectedState]?.[selectedCity] || [];

  const handleStateChange = (stateVal: string) => {
    setSelectedState(stateVal);
    const cities = Object.keys(STATE_CITY_WARD_MAP[stateVal] || {});
    const defaultCity = cities[0] || "";
    setSelectedCity(defaultCity);
    if (defaultCity) {
      const wards = STATE_CITY_WARD_MAP[stateVal]?.[defaultCity] || [];
      setSelectedWardName(wards[0] || "");
    } else {
      setSelectedWardName("");
    }
  };

  const handleCityChange = (cityVal: string) => {
    setSelectedCity(cityVal);
    const wards = STATE_CITY_WARD_MAP[selectedState]?.[cityVal] || [];
    setSelectedWardName(wards[0] || "");
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const finalWard = `${selectedState} - ${selectedCity} - ${selectedWardName}`;
      const result = await registerWithEmail(name, email, role, finalWard);
      onAuthSuccess(result.profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Email registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6">
        {/* Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-sans font-black text-slate-900 dark:text-white">Secure Access Panel</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to submit complaints, earn impact points, or update ward resolution workflows.
          </p>
        </div>

        {/* Real Google Sign-in Trigger */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 border border-slate-200 dark:border-slate-800 hover:border-slate-400 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-98 shadow-sm"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6-4.53z"
            />
          </svg>
          Sign In with Google
        </button>

        {/* OR Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-150 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 font-mono uppercase">Or Register Instantly</span>
          <div className="flex-grow border-t border-slate-150 dark:border-slate-800"></div>
        </div>

        {/* Errors display */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold leading-relaxed border border-red-150">
            {errorMsg}
          </div>
        )}

        {/* REGULAR EMAIL SIGN UP FORM */}
        <form onSubmit={handleEmailSignUp} className="space-y-4 pt-1 animate-fade-in">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email Address</label>
            <input
              type="email"
              placeholder="e.g. ramesh@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Role select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Registration Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="citizen" className="bg-white dark:bg-slate-900 text-slate-800">Citizen</option>
              <option value="official" className="bg-white dark:bg-slate-900 text-slate-800">Municipal Official</option>
            </select>
          </div>

          {/* Cascading State -> City -> Ward Selection */}
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Geographical Locality</span>
            
            {/* State Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">State</label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {availableStates.map(st => (
                  <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-800">{st}</option>
                ))}
              </select>
            </div>

            {/* City Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">City</label>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {availableCities.map(ct => (
                  <option key={ct} value={ct} className="bg-white dark:bg-slate-900 text-slate-800">{ct}</option>
                ))}
              </select>
            </div>

            {/* Ward Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Ward Locality</label>
              <select
                value={selectedWardName}
                onChange={(e) => setSelectedWardName(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {availableWards.map(wd => (
                  <option key={wd} value={wd} className="bg-white dark:bg-slate-900 text-slate-800">{wd}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            {loading ? "Creating Profile Account..." : "Create Account & Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
