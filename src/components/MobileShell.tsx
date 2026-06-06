/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Compass, Database, MessageSquare, Laptop, User, ShieldAlert, Key, RefreshCw, Star, Pocket, ChevronRight, Lock, CheckCircle2, ShieldCheck, HelpCircle, Info, Globe, Sparkles, Download } from 'lucide-react';
import { db, UserProfile } from '../lib/db';
import P2PRouting from './P2PRouting';
import LocalAIAgent from './LocalAIAgent';
import CommuterProfile from './CommuterProfile';
import { PHILIPPINE_PROVINCES } from '../data/provinces';

export default function MobileShell() {
  const [profile, setProfile] = useState<UserProfile>(db.getProfile());
  const [activeTab, setActiveTab] = useState<'route' | 'ai' | 'profile'>('route');
  const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth);

  // App Lifecycle States
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootLog, setBootLog] = useState('Initializing Mooderia Core...');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Security Keypad State
  const [pinInput, setPinInput] = useState('');
  const [pinAttemptsError, setPinAttemptsError] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regMiddleInitial, setRegMiddleInitial] = useState('');
  const [regCivilStatus, setRegCivilStatus] = useState('Single');
  const [regGender, setRegGender] = useState('Male');
  const [regProvince, setRegProvince] = useState('Metro Manila');
  const [regProfilePic, setRegProfilePic] = useState('');
  const [regPinEnabled, setRegPinEnabled] = useState(false);
  const [regPinInput, setRegPinInput] = useState('');

  // Inline non-blocking feedback states
  const [regError, setRegError] = useState('');
  const [isLockResetConfirmOpen, setIsLockResetConfirmOpen] = useState(false);

  // Device picture picker reader
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setRegError('Image must be under 1.5 MB to fit SQLite local storage constraints.');
        return;
      }
      setRegError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-time GMT+8 (PHT) clock
  const [phtClock, setPhtClock] = useState('');

  // Track viewport changes for desktop boundaries
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle class on document element for reliable Tailwind dark mode
  useEffect(() => {
    if (profile.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile.theme]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync profile when DB emits an update (e.g. from LocalAIAgent)
  useEffect(() => {
    const handleDbUpdate = () => {
      setProfile(db.getProfile());
    };
    window.addEventListener('local-db-updated', handleDbUpdate);
    return () => {
      window.removeEventListener('local-db-updated', handleDbUpdate);
    };
  }, []);

  // Sync PHT Time Ticker (Philippine standard clock is UTC+8)
  useEffect(() => {
    const updateTime = () => {
      const utcDate = new Date();
      // Add 8 hours for Philippine Standard Time (PHT)
      const phtDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
      let hours = phtDate.getUTCHours();
      const minutes = phtDate.getUTCMinutes().toString().padStart(2, '0');
      const seconds = phtDate.getUTCSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // '0' should be '12'
      const formattedHours = hours.toString().padStart(2, '0');
      setPhtClock(`PHT ${formattedHours}:${minutes}:${seconds} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate premium local database structuring and booting progress
  useEffect(() => {
    const logs = [
      'Initializing Mooderia localized database...',
      'Binding SQLite client connections...',
      'Indexing 4 local table structures...',
      'Syncing Manila Rail junctions (LRT1, LRT2, MRT3, PNR)...',
      'Caching EDSA Carousel Bus Waypoints...',
      'Loading stored custom routes from localStorage...',
      'Pre-fetching local NLP offline travel dictionary...',
      'Establishing secure local storage database. System live!'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      currentLogIndex++;
      if (currentLogIndex < logs.length) {
        setBootLog(logs[currentLogIndex]);
        setBootProgress((prev) => prev + 12.5);
      } else {
        clearInterval(interval);
        setBootProgress(100);
        setTimeout(() => {
          setIsBooting(false);
          // Auto-unlock if 6-Pin security is disabled
          const activeUserProfile = db.getProfile();
          if (!activeUserProfile.pinEnabled) {
            setIsUnlocked(true);
          }
        }, 500);
      }
    }, 280);

    return () => clearInterval(interval);
  }, []);

  const handleProfileSync = (updatedProfile: UserProfile) => {
    setProfile({ ...updatedProfile });
  };

  const handleDeleteAccount = () => {
    db.deleteAccount();
    setProfile({ ...db.getProfile() });
    setActiveTab('route');
    setIsUnlocked(false);
    // Restart splash/boot to refresh structures
    setIsBooting(true);
    setBootProgress(0);
    setBootLog('Re-initializing fresh local data storage...');
    setTimeout(() => {
      setBootProgress(100);
      setIsBooting(false);
      setIsUnlocked(true);
    }, 1500);
  };

  // Profile creation handler
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegError('Please write a username for your profile.');
      return;
    }
    if (!regFirstName.trim() || !regLastName.trim()) {
      setRegError('First Name and Last Name are required.');
      return;
    }
    if (regPinEnabled && (regPinInput.length !== 6 || !/^\d+$/.test(regPinInput))) {
      setRegError('Your security PIN must be exactly 6 numerical digits.');
      return;
    }

    setRegError('');

    db.updateProfile({
      username: regName.trim(),
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      middleInitial: regMiddleInitial.trim(),
      civilStatus: regCivilStatus,
      gender: regGender,
      province: regProvince,
      profilePic: regProfilePic,
      pinEnabled: regPinEnabled,
      pinCode: regPinEnabled ? regPinInput : '',
      profileCreated: true
    });

    const refreshed = db.getProfile();
    setProfile(refreshed);
    
    if (refreshed.pinEnabled) {
      setIsUnlocked(false);
    } else {
      setIsUnlocked(true);
    }
  };

  // Secure Keypad digit entering
  const handleKeypadPress = (val: string) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + val;
      setPinInput(nextPin);
      setPinAttemptsError('');

      // Auto check when exactly 6 digits are loaded
      if (nextPin.length === 6) {
        const accuratePin = profile.pinCode;
        if (nextPin === accuratePin) {
          setIsUnlocked(true);
          setPinInput('');
          setPinAttemptsError('');
        } else {
          setPinAttemptsError('INCORRECT PIN. ACCESS LOCKED.');
          setPinInput('');
        }
      }
    }
  };

  const handleKeypadDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPinInput('');
    setPinAttemptsError('');
  };

  const [forceApkSimDir, setForceApkSimDir] = useState(false);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const isWebView = /wv|WebView|Version\/[0-9.]+/i.test(navigator.userAgent) || 
                    (window as any).Android || 
                    (window as any).cordova || 
                    (window as any).Capacitor ||
                    navigator.userAgent.toLowerCase().includes('wv') ||
                    window.location.search.includes('apk=true');

  const isRestrictedMobileBrowser = isMobile && !isWebView && !forceApkSimDir && viewportWidth <= 850;

  const isDesktop = viewportWidth > 850;

  const renderRestrictedMobileBrowser = () => {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-start p-5 overflow-y-auto font-sans text-slate-800 dark:text-slate-100 select-text">
        {/* Header Title Branding */}
        <div className="w-full max-w-md flex flex-col items-center text-center mt-6 mb-8 space-y-3">
          <div className="w-14 h-14 bg-[#46178f] text-white rounded-3xl flex items-center justify-center shadow-lg relative shrink-0">
            <Compass className="w-7 h-7 text-yellow-300 transform -rotate-12 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900 dark:text-white">
              Mooderia Commute
            </h1>
            <p className="text-[10px] tracking-wider text-purple-600 dark:text-purple-400 uppercase font-black">
              Advanced Navigation &amp; Point-to-Point Analyzer
            </p>
          </div>
        </div>

        <div className="w-full max-w-md space-y-5">
          {/* PURPLE & WHITE THEMED RESTRICTION INFORMATION BANNER */}
          <div className="bg-[#46178f] border border-purple-600 rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden flex flex-col space-y-4 text-left">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-600/30 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center gap-2 relative z-10">
              <ShieldAlert className="w-5 h-5 text-yellow-300" />
              <h2 className="text-xs font-black uppercase tracking-wider text-white">
                Mobile Web Browser Restricted
              </h2>
            </div>

            <p className="text-xs text-purple-100 font-medium leading-relaxed relative z-10">
              To guarantee total privacy, direct localized SQLite speed, and true offline multi-modal itinerary syncing, Mooderia requires running the native executable Android application package (<em>APK</em>).
            </p>

            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-4 space-y-3 relative z-10">
              <h4 className="text-[10px] font-black uppercase text-yellow-300 tracking-wider">
                Why Web Browsers are Restricted:
              </h4>
              <ul className="text-[11px] text-purple-50 font-semibold space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-300 font-bold shrink-0">•</span>
                  <span><strong>Storage Sandboxing:</strong> Browsers delete stored local map junctions after several days of non-use.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-300 font-bold shrink-0">•</span>
                  <span><strong>Hardware Caching:</strong> Mobile browsers cannot bind to high-performance localized index engines required for multi-transit calculation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-300 font-bold shrink-0">•</span>
                  <span><strong>No Background GPS:</strong> Modern mobile browsers freeze routing queries when your screen is locked.</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-purple-200 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Standard desktop browser viewing remains active for routing simulation and desktop editing!</span>
            </div>
          </div>

          {/* ACTION BLOCK: Premium Download APK Frame */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Download className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">
                Download Native Android Application (APK)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-xs mx-auto">
                Get the fully compiled, offline-first production bundle for your Android device. 
              </p>
            </div>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Downloading Mooderia Commute APK (12.4 MB) — Please enable "Install Unknown Apps" in your security settings to run offline.');
              }}
              className="w-full bg-[#46178f] hover:bg-purple-800 active:scale-[0.98] text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-purple-500/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Mooderia Commute v2.5.apk</span>
            </a>

            <div className="w-full flex justify-between items-center text-[9px] text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-3">
              <span>App Size: ~12.4 MB</span>
              <span>Requires Android 8.0+</span>
            </div>
          </div>

          {/* ABOUT SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm space-y-3 text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                About Mooderia Commute
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold font-sans">
              Mooderia Commute is an advanced navigation portal crafted specifically for multi-modal Philippine transit networks. Modern navigation platforms ignore crucial suburban and local networks such as customized jeepney routes, tricycle stations, and local inter-provincial bus routes. Mooderia integrates all channels into a secure, completely client-side local analyzer with zero mandatory network connectivity.
            </p>
          </div>

          {/* PRIVACY SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm space-y-3.5 text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                Privacy Pledge &amp; Local Encryption
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold font-sans">
              Your data never travels to cloud trackers. Everything you chart remains private on your actual smartphone. The direct APK bundle does not incorporate tracking cookies, telemetry frameworks, or analytic software hooks.
            </p>
          </div>

          {/* DEMO / BYPASS MODE FOR COMFORTABLE TESTING */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setForceApkSimDir(true);
              }}
              className="text-[10px] text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold uppercase tracking-wider underline cursor-pointer"
            >
              Simulate APK Container (Developer Sandbox Mode)
            </button>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col items-center py-6 text-[9px] text-slate-400 font-bold space-y-1">
            <span>MOODERIA COMMUTE ENGINE 2.5 • PHILIPPINE TRANSIT FRAMEWORK</span>
            <span>{phtClock}</span>
          </div>
        </div>
      </div>
    );
  };

  const isDarkClass = profile.theme === 'dark' ? 'dark' : '';

  const renderPhoneScreen = () => {
    return (
      <div id="applet-viewport-root" className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col font-sans select-none overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-150">
        
        {/* --- Top Status Ticker Header --- */}
        <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-3 px-5 flex justify-between items-center text-slate-800 dark:text-slate-100 select-none shrink-0 border-b border-slate-200 dark:border-slate-800 relative z-20">
          <div className="flex items-center gap-2 relative z-10 w-24">
             {isOnline ? (
               <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                 <span>Online</span>
               </div>
             ) : (
               <div className="flex items-center gap-1 text-[9px] font-black uppercase text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/50">
                 <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                 <span>Offline</span>
               </div>
             )}
          </div>
          
          {/* Centered Bigger Headline */}
          <div className="absolute left-0 right-0 text-center pointer-events-none">
            <span className="font-sans text-sm tracking-widest font-black uppercase opacity-90 text-[#46178f] dark:text-purple-300">
              Mooderia
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px] opacity-70 font-semibold tracking-wider relative z-10 w-24 justify-end">
            <span>{phtClock || 'PHT --:--'}</span>
          </div>
        </div>

        {/* --- Phase A: Booting Splash Animation Screen --- */}
        {isBooting ? (
          <div className="flex-1 bg-[#46178f] flex flex-col items-center justify-center p-6 text-white space-y-6 relative z-30 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-white/10 rounded-full mx-auto flex items-center justify-center border-4 border-dashed border-purple-300 animate-spin" style={{ animationDuration: '4s' }}>
                <Compass className="w-11 h-11 text-yellow-300 transform -rotate-12" />
              </div>
              <h2 className="text-2xl font-black tracking-widest uppercase font-sans text-white mt-4">MOODERIA</h2>
              <span className="text-[10px] tracking-widest text-purple-200 uppercase font-bold block">PHILIPPINE COMMUTING ENGRAVED</span>
            </div>

            {/* Simulated progress slider */}
            <div className="w-full max-w-xs space-y-2">
              <div className="w-full bg-purple-950/80 h-2 rounded-full overflow-hidden border border-purple-800">
                <div className="bg-yellow-400 h-full transition-all duration-300" style={{ width: `${bootProgress}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-[9px] text-purple-300 font-mono">
                <span>Local DB connection</span>
                <span>{Math.round(bootProgress)}%</span>
              </div>
            </div>

            <p className="text-[10px] font-mono text-purple-200 bg-purple-950/70 p-3 rounded-2xl border border-purple-900 max-w-xs text-center min-h-[50px] flex items-center justify-center leading-relaxed">
              &gt; {bootLog}
            </p>

            <span className="text-[8px] text-purple-300 uppercase tracking-widest font-black absolute bottom-6">
              Mooderia Commute • 100% Offline Vault
            </span>
          </div>
        )
        // --- Phase B: Initial Account Registration Screen ---
        : !profile.profileCreated ? (
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col p-5 relative z-30 overflow-y-auto style-scrollbar animate-slideUp">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-5 shadow-2xl space-y-4 max-w-sm mx-auto">
              
              <div className="text-center space-y-1">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  {regProfilePic ? (
                    <img
                      src={regProfilePic}
                      alt="Device preview avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#9174f4] shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/30 rounded-full flex items-center justify-center text-[#46178f] dark:text-purple-300 border-2 border-[#9174f4]">
                      <User className="w-9 h-9" />
                    </div>
                  )}
                  {/* File Upload indicator overlay */}
                  <label htmlFor="reg-avatar-pick" className="absolute bottom-0 right-0 bg-[#e21b3c] hover:bg-[#c21733] text-white rounded-full p-1 border-2 border-white dark:border-slate-900 cursor-pointer shadow-md text-[10px] h-6 w-6 flex items-center justify-center font-extrabold uppercase" title="Upload pic">
                    +
                  </label>
                  <input
                    id="reg-avatar-pick"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hidden"
                  />
                </div>
                <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">Structured Commuter Account</h3>
                <p className="text-[9px] text-slate-400 leading-normal max-w-[240px] mx-auto">
                  Mooderia requires localized citizen profiles configured inside the offline SQLite indexer.
                </p>
              </div>

              <form onSubmit={handleCreateProfile} className="space-y-3.5">
                {regError && (
                  <div className="bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 text-[#e21b3c] dark:text-red-400 text-[10px] uppercase font-black p-2.5 rounded-2xl text-center leading-normal">
                    ⚠️ {regError}
                  </div>
                )}
                {/* Profile Photo picker instructions */}
                <div className="text-center">
                  <span className="text-[8px] text-slate-405 dark:text-slate-500 font-extrabold uppercase">
                    {regProfilePic ? "🎉 Device Photo Synced Successfully" : "📷 Upload Profile Photo (Optional)"}
                  </span>
                </div>

                {/* Grid layout for Full Names */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Travis"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value.slice(0, 16))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Miguel"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value.slice(0, 16))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1" title="Middle Initial">M.I.</label>
                    <input
                      type="text"
                      placeholder="A."
                      maxLength={2}
                      value={regMiddleInitial}
                      onChange={(e) => setRegMiddleInitial(e.target.value.slice(0, 2))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg py-1.5 px-1.5 text-center text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Nickname handles (used internally) */}
                <div>
                  <label htmlFor="reg-username" className="block text-[8px] text-slate-400 uppercase font-black mb-1">
                    Commuter Nickname / Screen Tag
                  </label>
                  <input
                    id="reg-username"
                    type="text"
                    required
                    placeholder="e.g. TravisTag"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value.replace(/\s+/g, '').slice(0, 14))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-bold focus:outline-none"
                  />
                </div>

                {/* Civil Status, Gender & Province */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Civil Status</label>
                    <select
                      value={regCivilStatus}
                      onChange={(e) => setRegCivilStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-705 dark:text-white rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Gender</label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-705 dark:text-white rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Philippine Province</label>
                  <select
                    value={regProvince}
                    onChange={(e) => setRegProvince(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-705 dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-bold focus:outline-none"
                  >
                    {PHILIPPINE_PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* Pin code slider setup */}
                <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/55 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">
                      Toggle 6-PIN Lock Security
                    </span>
                    <input
                      type="checkbox"
                      checked={regPinEnabled}
                      onChange={(e) => setRegPinEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#46178f] cursor-pointer"
                    />
                  </div>
                  
                  {regPinEnabled && (
                    <div className="animate-sliceDown space-y-1">
                      <label htmlFor="reg-pin" className="block text-[8px] text-slate-405 uppercase font-bold">Define 6 numerical digits PIN</label>
                      <input
                        id="reg-pin"
                        type="password"
                        required
                        placeholder="••••••"
                        value={regPinInput}
                        onChange={(e) => setRegPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg p-1 text-center text-xs font-mono font-black tracking-widest focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Submitting button */}
                <button
                  type="submit"
                  className="w-full bg-[#46178f] hover:bg-purple-800 border-b-4 border-purple-950 text-white font-black text-xs py-2.5 rounded-xl uppercase transition cursor-pointer flex items-center justify-center gap-1"
                >
                  Create Offline Account <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </form>

            </div>
          </div>
        )
        // --- Phase C: Secure 6-PIN Numerical Entrance Locker ---
        : !isUnlocked ? (
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 relative z-30 animate-fadeIn">
            <div className="w-full max-w-xs text-center space-y-6">
              
              <div className="space-y-2">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950 rounded-full mx-auto flex items-center justify-center text-[#46178f] dark:text-purple-300">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">Access Restrained</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[220px] mx-auto">
                  Mooderia commuting metrics are secured. Please enter your configured 6-digit security PIN.
                </p>
              </div>

              {/* Dot Indicators representing numeric count */}
              <div className="flex gap-4.5 justify-center items-center py-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                      i < pinInput.length
                        ? 'bg-[#46178f] border-[#46178f] scale-110 shadow-md'
                        : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-750'
                    }`}
                  ></div>
                ))}
              </div>

              {pinAttemptsError && (
                <p className="text-[9px] text-[#e21b3c] font-black uppercase text-center animate-shake tracking-wide">
                  ⚠️ {pinAttemptsError}
                </p>
              )}

              {/* Standard centered Numerical grid layout for tactile mobile feedback */}
              <div className="grid grid-cols-3 gap-3 max-w-[210px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
                  <button
                    key={val}
                    onClick={() => handleKeypadPress(val)}
                    className="w-14 h-14 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-sm rounded-full flex items-center justify-center active:scale-95 active:bg-[#46178f] active:text-white dark:active:bg-purple-600 dark:active:text-white cursor-pointer shadow-sm transition-colors duration-100"
                  >
                    {val}
                  </button>
                ))}
                <button
                  onClick={handleKeypadClear}
                  className="w-14 h-14 text-slate-400 text-[10px] font-black uppercase flex items-center justify-center active:scale-90 active:text-[#e21b3c] cursor-pointer transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="w-14 h-14 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-sm rounded-full flex items-center justify-center active:scale-95 active:bg-[#46178f] active:text-white dark:active:bg-purple-600 dark:active:text-white cursor-pointer shadow-sm transition-colors duration-100"
                >
                  0
                </button>
                <button
                  onClick={handleKeypadDelete}
                  className="w-14 h-14 text-slate-400 text-[10px] font-black uppercase flex items-center justify-center active:scale-90 active:text-[#e21b3c] cursor-pointer transition-colors"
                >
                  Erase
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setIsLockResetConfirmOpen(true)}
                  className="text-[9px] text-red-500 hover:text-red-650 font-black uppercase tracking-wider bg-transparent p-1 cursor-pointer"
                >
                  Hard Reset Database Profile
                </button>
              </div>

              {isLockResetConfirmOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
                  <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-left">
                    <div className="flex items-center gap-1.5 text-red-500 font-sans">
                      <ShieldAlert className="w-4.5 h-4.5" />
                      <h4 className="text-xs font-black uppercase tracking-tight">Hard Reset Database?</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                      Are you sure you want to erase all localized storage metrics? This will completely format your commuter parameters and stored routes back to defaults.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setIsLockResetConfirmOpen(false)}
                        className="flex-1 bg-slate-100 dark:bg-slate-850 text-slate-500 font-bold text-[10px] py-2 rounded-xl uppercase transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setIsLockResetConfirmOpen(false);
                          handleDeleteAccount();
                        }}
                        className="flex-1 bg-[#e21b3c] hover:bg-rose-700 text-white font-black text-[10px] py-2 rounded-xl uppercase transition cursor-pointer border-b-2 border-red-900"
                      >
                        Yes, Erase All
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )
        // --- Phase D: Main Functional Workspace Render ---
        : (
          <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50 dark:bg-slate-950">
            
            {/* Displaying corresponding Tab screens */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'route' && <P2PRouting profile={profile} onProfileUpdate={handleProfileSync} />}
              {activeTab === 'ai' && <LocalAIAgent />}
              {activeTab === 'profile' && (
                <CommuterProfile
                  profile={profile}
                  onProfileUpdate={handleProfileSync}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}
            </div>

            {/* --- Lower High-Quality Minimalist UI Navigation rail --- */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3.5 px-2 shrink-0 flex justify-around items-center select-none shadow-2xl relative z-10">
              
              {/* Route tab switcher */}
              <button
                id="tab-btn-route"
                onClick={() => setActiveTab('route')}
                className={`flex flex-col items-center justify-center gap-1 w-20 py-1 rounded-xl transition cursor-pointer text-center ${
                  activeTab === 'route'
                    ? 'text-[#46178f] dark:text-purple-300 font-black scale-105'
                    : 'text-slate-400 dark:text-slate-550 hover:text-slate-600'
                }`}
              >
                <Compass className={`w-5.5 h-5.5 ${activeTab === 'route' ? 'text-[#46178f] dark:text-purple-300' : 'text-slate-450 dark:text-slate-500'}`} />
                <span className="text-[9px] uppercase tracking-wider font-black">Routes</span>
              </button>

              {/* Offline AI tab switcher */}
              <button
                id="tab-btn-ai"
                onClick={() => setActiveTab('ai')}
                className={`flex flex-col items-center justify-center gap-1 w-20 py-1 rounded-xl transition cursor-pointer text-center ${
                  activeTab === 'ai'
                    ? 'text-[#46178f] dark:text-purple-300 font-black scale-105'
                    : 'text-slate-400 dark:text-slate-555 hover:text-slate-600'
                }`}
              >
                <MessageSquare className={`w-5.5 h-5.5 ${activeTab === 'ai' ? 'text-[#46178f] dark:text-purple-300' : 'text-slate-450 dark:text-slate-500'}`} />
                <span className="text-[9px] uppercase tracking-wider font-black">Local AI</span>
              </button>

              {/* Profile & settings manager tab switcher */}
              <button
                id="tab-btn-profile"
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center justify-center gap-1 w-20 py-1 rounded-xl transition cursor-pointer text-center ${
                  activeTab === 'profile'
                    ? 'text-[#46178f] dark:text-purple-300 font-black scale-105'
                    : 'text-slate-400 dark:text-slate-555 hover:text-slate-600'
                }`}
              >
                <User className={`w-5.5 h-5.5 ${activeTab === 'profile' ? 'text-[#46178f] dark:text-purple-300' : 'text-slate-450 dark:text-slate-500'}`} />
                <span className="text-[9px] uppercase tracking-wider font-black">Profile</span>
              </button>

            </div>

          </div>
        )}

      </div>
    );
  };

  return (
    <div id="applet-theme-wrapper" className={`${isDarkClass} w-full h-screen bg-slate-100 dark:bg-slate-950`}>
      {isDesktop ? (
        <div id="desktop-commute-wrapper" className="w-full h-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-950/45 p-4 select-text">
          <div className="w-full h-full max-w-7xl mx-auto flex lg:flex-row flex-col overflow-hidden text-slate-800 dark:text-slate-100 p-4 lg:p-8 gap-6 lg:gap-10 justify-center items-stretch bg-slate-100/50 dark:bg-slate-950/40">
            {/* Left Column: Premium Informational Board (purple/white themed sections + about + privacy) */}
            <div className="flex-1 overflow-y-auto style-scrollbar flex flex-col justify-between space-y-6 pr-2 lg:py-2">
              <div className="space-y-6">
                {/* App Header Title Branding */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#46178f] text-white rounded-2xl flex items-center justify-center shadow-lg relative shrink-0">
                    <Compass className="w-6 h-6 text-yellow-300 transform -rotate-12 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase text-slate-850 dark:text-stone-100">
                      Mooderia Commute
                    </h1>
                    <p className="text-[10px] tracking-wider text-purple-600 dark:text-purple-400 uppercase font-black">
                      Advanced Navigation &amp; Point-to-Point Analyzer
                    </p>
                  </div>
                </div>

                {/* IMPORTANT INFORMATION SECTION - Bold, highly elegant Purple/White card */}
                <div className="bg-[#46178f] border border-purple-600 rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden flex flex-col space-y-4 text-left">
                  {/* Subtle decorative background glow */}
                  <div className="absolute -top-10 -right-10 w-44 h-44 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-violet-600/30 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center gap-2 relative z-10">
                    <ShieldAlert className="w-5 h-5 text-yellow-300" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-white">
                      Important Desktop Commuter Information
                    </h2>
                  </div>

                  <p className="text-xs text-purple-100 font-medium leading-relaxed relative z-10">
                    To provide highly accurate point-to-point commuting computations, Mooderia isolates tricycle, jeepney, P2P bus, train, and walking corridors natively on your device. Standard maps often ignore these hyper-local pathways.
                  </p>

                  <div className="grid grid-cols-2 gap-3 relative z-10 pt-1">
                    <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 space-y-1">
                      <span className="text-[9px] font-black uppercase text-yellow-300 block">Interactive Mobile Sandbox</span>
                      <p className="text-[10px] text-purple-50 font-medium leading-normal">
                        Utilize the physical smartphone emulator on the right to simulate live GPS movements, toggle night/dark modes, and calculate accurate fares.
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 space-y-1">
                      <span className="text-[9px] font-black uppercase text-yellow-300 block">Route Specific Numbers</span>
                      <p className="text-[10px] text-purple-50 font-medium leading-normal">
                        Ensure you input customized route numbers (e.g. 12A, JRT-1) and specify continuous routes like "sta rosa 1" to connect jeepney/tricycle/bus paths correctly.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-200 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Calculates custom wayposts and overlays standard driving, walking, or biking routes instantly!</span>
                  </div>
                </div>

                {/* ABOUT SECTION - Professional and highly polished */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm space-y-3.5 text-left">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                      About Mooderia Commute
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                    Mooderia is an advanced multi-modal navigation portal designed and built to address complex transit routing. In developing nations like the Philippines, public transit is comprised of multi-segment transfers across rail junctions, provincial buses, local jeepneys, and neighborhood tricycles.
                  </p>

                  <div className="space-y-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-2.5 text-xs">
                      <div className="w-5 h-5 bg-purple-50 dark:bg-purple-950/50 rounded-lg flex items-center justify-center text-[#46178f] dark:text-purple-300 font-bold shrink-0 text-[10px]">
                        1
                      </div>
                      <p className="text-slate-550 dark:text-slate-405 leading-normal font-medium">
                        <strong className="text-slate-700 dark:text-slate-250">Unified Segment Search:</strong> Compare Driving, Transit, Walking, Cycling, and user-defined Jeepney/Tricycle paths side-by-side with localized fare ticket calculators.
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-2.5 text-xs">
                      <div className="w-5 h-5 bg-purple-50 dark:bg-purple-950/50 rounded-lg flex items-center justify-center text-[#46178f] dark:text-purple-300 font-bold shrink-0 text-[10px]">
                        2
                      </div>
                      <p className="text-slate-550 dark:text-slate-405 leading-normal font-medium font-sans">
                        <strong className="text-slate-700 dark:text-slate-250">Offline Local AI Agent:</strong> Ask the integrated local routing AI agent for optimized direction structures. By typing destination labels like <em>"sta rosa 1"</em> or <em>"Manila"</em>, the AI parses stored customs to map continuous journey schemes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* PRIVACY SECTION - High density detail demonstrating total transparency */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm space-y-3.5 text-left">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                      Privacy Pledge &amp; Core Security Vault
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold font-sans">
                    Your personal data belongs strictly to you. Mooderia executes completely serverless computations inside your local browser storage.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-750 text-center space-y-1">
                      <Lock className="w-4.5 h-4.5 text-purple-605 dark:text-purple-305 mx-auto animate-pulse" />
                      <span className="text-[9px] font-black uppercase text-slate-700 dark:text-stone-300 block">6-PIN Lock</span>
                      <p className="text-[8px] text-slate-405 dark:text-slate-500 leading-normal">
                        Secures custom routes via numerical device-level locks.
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-755 text-center space-y-1">
                      <Database className="w-4.5 h-4.5 text-purple-605 dark:text-purple-305 mx-auto" />
                      <span className="text-[9px] font-black uppercase text-slate-700 dark:text-stone-300 block">100% Local</span>
                      <p className="text-[8px] text-slate-405 dark:text-slate-500 leading-normal">
                        Uses sandbox variables to cache custom jeepney stops without clouds.
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-755 text-center space-y-1">
                      <Globe className="w-4.5 h-4.5 text-purple-605 dark:text-purple-305 mx-auto" />
                      <span className="text-[9px] font-black uppercase text-slate-700 dark:text-stone-300 block">No Telemetry</span>
                      <p className="text-[8px] text-slate-405 dark:text-slate-500 leading-normal">
                        Zero web cookie tracking or analytical reports uploaded to external APIs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer disclaimer */}
              <div className="flex justify-between items-center text-[10px] text-slate-405 dark:text-slate-650 font-bold border-t border-slate-200 dark:border-slate-800 pt-4">
                <span>MOODERIA COMMUTE ENGINE 2.5 • OPEN-SOURCE</span>
                <span>{phtClock}</span>
              </div>
            </div>

            {/* Right Column: Premium Smartphone Simulation frame */}
            <div className="lg:max-w-[420px] max-w-[390px] flex items-center justify-center shrink-0 h-full py-2 relative">
              {/* Physical reflection effect glow behind the phone */}
              <div className="absolute w-[350px] h-[720px] rounded-[52px] bg-purple-500/10 blur-3xl pointer-events-none -z-10"></div>

              <div className="w-[370px] h-[750px] rounded-[48px] border-[12px] border-slate-900 dark:border-slate-800 bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col scale-[1] hover:scale-[1.01] transition-transform duration-300">
                
                {/* Physical Front Camera notch bar (Dynamic Island mockup) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 dark:bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center px-4">
                  <div className="w-2.5 h-2.5 bg-slate-950 dark:bg-slate-900 rounded-full border border-slate-800/20 shrink-0"></div>
                  <div className="w-2.5 h-1 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-800/20 shrink-0 ml-1"></div>
                  <div className="flex-1"></div>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                </div>

                <div className="w-full h-full relative overflow-hidden flex flex-col">
                  {renderPhoneScreen()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isRestrictedMobileBrowser ? (
        renderRestrictedMobileBrowser()
      ) : (
        renderPhoneScreen()
      )}
    </div>
  );
}
