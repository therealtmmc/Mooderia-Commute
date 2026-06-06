/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, SavedRoute, UserProfile } from '../lib/db';
import RouteManager from './RouteManager';
import { MapPin, Coins, ArrowRight, X, Sparkles, Navigation, Info, Wallet, Plus, RotateCcw, Check, Lock, Play, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface P2PRoutingProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
}

export default function P2PRouting({ profile, onProfileUpdate }: P2PRoutingProps) {
  const [selectedRoute, setSelectedRoute] = useState<SavedRoute | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Custom alert & toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modal States
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [isCommuteDoneConfirmOpen, setIsCommuteDoneConfirmOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Stash details of celebrated/just completed stats for summary rendering
  const [celebratedStats, setCelebratedStats] = useState({ trips: 0, cost: 0 });

  // Sync state helper
  const syncData = () => {
    onProfileUpdate({ ...db.getProfile() });
    setRefreshKey(prev => prev + 1);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Return elegant category text matching the theme
  const getSubtext = (type: string) => {
    if (type.includes('LRT') || type.includes('MRT')) return 'Philippine Rapid Railway Transit Node';
    if (type.includes('Bus')) return 'EDSA Busway / National Highway Link';
    if (type.includes('UV')) return 'Express Shuttles Utility Vehicle Link';
    return 'Custom Specialized Community Path';
  };

  // Add commuter funds action
  const handlePerformAddMoney = (amountToLoad: number) => {
    if (isNaN(amountToLoad) || amountToLoad <= 0) {
      showToast("Please enter a positive numeric amount.", "error");
      return;
    }

    const currentBala = profile.currentBala || 0;
    db.updateProfile({
      currentBala: currentBala + amountToLoad
    });
    
    syncData();
    setIsAddMoneyOpen(false);
    setAddAmount('');
    showToast(`₱${amountToLoad.toFixed(2)} added safely to e-wallet!`, "success");
  };

  // Deduct money when route is started
  const handleStartCommute = (route: SavedRoute) => {
    const walletBalance = profile.currentBala || 0;
    if (walletBalance < route.expenseValue) {
      showToast(`Blocked: Please top up by ₱${(route.expenseValue - walletBalance).toFixed(2)} first!`, "error");
      return;
    }

    const newBalance = walletBalance - route.expenseValue;
    const todayTrips = profile.todayTrips || 0;
    const todayCost = profile.todayCost || 0;

    db.updateProfile({
      currentBala: newBalance,
      todayTrips: todayTrips + 1,
      todayCost: todayCost + route.expenseValue
    });

    syncData();
    showToast(`Commuted ₱${route.expenseValue.toFixed(2)}! Safe travels!`, "success");
  };

  // Complete commute day (Flush today's stats to lifetime storage & reset wallet to zero)
  const handlePerformCommuteDone = () => {
    const tTrips = profile.todayTrips || 0;
    const tCost = profile.todayCost || 0;

    if (tTrips === 0) {
      showToast("No active trips started today yet. Swipe a route first!", "error");
      setIsCommuteDoneConfirmOpen(false);
      return;
    }

    // Save temporary details for celebration screen render
    setCelebratedStats({ trips: tTrips, cost: tCost });

    // Deduct and reset e-wallet, append stats to lifetime
    db.updateProfile({
      currentBala: 0, // Reset wallet to zero
      tripsTaken: (profile.tripsTaken || 0) + tTrips,
      totalSpent: (profile.totalSpent || 0) + tCost,
      todayTrips: 0,
      todayCost: 0
    });

    syncData();
    setSelectedRoute(null);
    setIsCommuteDoneConfirmOpen(false);
    setShowCelebration(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none overflow-y-auto style-scrollbar relative">
      
      {/* Wallet Balance Header Banner */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-950/40 rounded-full flex items-center justify-center text-[#46178f] dark:text-purple-300">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block leading-none">
                Commuter E-Wallet
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₱{(profile.currentBala || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            id="wallet-add-money-btn"
            onClick={() => setIsAddMoneyOpen(true)}
            className="bg-[#46178f] hover:bg-[#361175] active:scale-95 text-white text-[10px] uppercase font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition border-b-2 border-purple-950 cursor-pointer shadow-sm animate-pulse"
          >
            <Plus className="w-3.5 h-3.5" /> Add Money
          </button>
        </div>

        {/* Live today stats ticker */}
        <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-850">
          <div className="text-center">
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Today's Swipes</span>
            <span className="text-xs font-black font-mono text-[#46178f] dark:text-purple-300">
              {profile.todayTrips || 0}
            </span>
          </div>
          <div className="text-center border-l border-slate-200 dark:border-slate-800">
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Today's Cost</span>
            <span className="text-xs font-black font-mono text-amber-500">
              ₱{(profile.todayCost || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Route List / Display Area */}
      <div className="p-4 space-y-4 flex-1">
        
        {/* Main Route Directory */}
        <RouteManager 
          onRouteSelected={(route) => {
            setSelectedRoute(route);
          }} 
          currentBalance={profile.currentBala}
          refreshKey={refreshKey}
        />

        {/* Selected Route Detail Viewer */}
        {selectedRoute ? (
          <div className="bg-gradient-to-br from-[#46178f]/5 to-[#46178f]/10 dark:from-purple-950/25 dark:to-slate-900 border-2 border-[#9174f4]/45 rounded-3xl p-4.5 shadow-sm space-y-4 animate-fadeIn relative">
            
            {/* Close details button */}
            <button
              onClick={() => setSelectedRoute(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer shadow transition"
              title="Close details"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Title / Badge */}
            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] bg-[#46178f] dark:bg-purple-900 text-white dark:text-purple-200 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                  {selectedRoute.type}
                </span>
                <span className="text-[10px] text-[#46178f] dark:text-purple-300 font-extrabold font-mono">
                  ACTIVE ROUTE
                </span>
              </div>
              <h4 className="text-sm font-black dark:text-white leading-tight mt-1">{selectedRoute.name}</h4>
              <p className="text-[9px] text-slate-400 leading-normal">
                {getSubtext(selectedRoute.type)}
              </p>
            </div>

            {/* Travel Stations Board */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
                  <span className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">Depart station:</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right max-w-[60%] truncate">
                  {selectedRoute.fromStop}
                </span>
              </div>

              {/* Connecting path animation */}
              <div className="flex items-center gap-2 pl-1">
                <div className="w-0.5 h-4 bg-dashed border-l border-slate-200 dark:border-slate-750"></div>
                <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest italic py-0.5">
                  Transit Path Linked
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <div className="w-2.5 h-2.5 bg-[#e21b3c] rounded-full shrink-0"></div>
                  <span className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">Alight station:</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right max-w-[60%] truncate">
                  {selectedRoute.toStop}
                </span>
              </div>
            </div>

            {/* Fare Breakdown and Notes */}
            <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <div className="leading-tight">
                <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Estimated Fare</span>
                <span className="text-lg font-black text-amber-500 font-mono font-black">₱{selectedRoute.expenseValue.toFixed(2)}</span>
              </div>

              {selectedRoute.notes ? (
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 text-[10px] text-slate-500 max-w-[180px] leading-relaxed">
                  <span className="font-bold text-slate-404 block text-[8px] uppercase tracking-wider mb-0.5">💡 Commute Tip</span>
                  {selectedRoute.notes}
                </div>
              ) : (
                <div className="text-[9px] text-slate-404 italic">No custom notes registered.</div>
              )}
            </div>

            {/* START ROUTE BUTTON */}
            <button
              onClick={() => handleStartCommute(selectedRoute)}
              className="w-full bg-[#26890c] hover:bg-[#1f6d0a] active:scale-[0.99] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border-b-4 border-[#175207]"
            >
              <Play className="w-4 h-4 fill-white animate-bounce" /> Start Route Commute
            </button>

            {/* Offline AI Advice */}
            <div className="bg-purple-50/30 dark:bg-purple-950/10 p-3 rounded-2xl border border-purple-100/40 dark:border-purple-950/40 space-y-1.5 text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="text-[8px] font-black text-[#46178f] dark:text-purple-300 uppercase tracking-widest block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-500" /> Offline Commuter Assistant Advice
              </span>
              <p>
                To travel from <strong className="text-slate-800 dark:text-white">{selectedRoute.fromStop}</strong> to <strong className="text-slate-800 dark:text-white">{selectedRoute.toStop}</strong> using <strong>{selectedRoute.type}</strong>, prepare around <strong className="text-amber-600">₱{selectedRoute.expenseValue.toFixed(0)}</strong> in your e-wallet. Swipe the start button to deduct fares automatically and begin transit tracks safely.
              </p>
            </div>

          </div>
        ) : (
          <div className="text-center py-6 px-4 bg-purple-50/25 dark:bg-purple-950/5 border border-dashed border-purple-200/60 dark:border-purple-950/45 rounded-3xl space-y-1 select-none">
            <span className="text-lg">👇</span>
            <p className="text-[9px] text-slate-450 dark:text-purple-300 uppercase tracking-widest font-black">
              Commute Detail Inspector
            </p>
            <p className="text-[8px] text-slate-400 max-w-[200px] mx-auto">
              Tap any non-blocked saved route from your directory tracker above to expand complete details and start your trip.
            </p>
          </div>
        )}

        {/* COMMUTE DONE ACTION */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              if ((profile.todayTrips || 0) === 0) {
                showToast("No active swipes recorded today. Swipe a route first!", "error");
              } else {
                setIsCommuteDoneConfirmOpen(true);
              }
            }}
            className="w-full bg-[#e21b3c] hover:bg-[#c21733] active:scale-[0.99] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition border-b-4 border-[#a0132a] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Commute Done (Reset Day)
          </button>
          <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 text-center block mt-2 text-rose-500/80 leading-normal">
            Swiping Done resets remaining e-wallet balance to zero and logs today's cumulative items into lifetime dashboard stats.
          </span>
        </div>

      </div>

      {/* --- IN-APP INLINE TOAST FEEDBACK --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-20 left-4 right-4 z-50 pointer-events-none flex justify-center"
          >
            <div className={`shadow-xl px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase text-white flex items-center gap-2 border ${
              toast.type === 'error' 
                ? 'bg-[#e21b3c] border-[#a0132a]' 
                : toast.type === 'info'
                  ? 'bg-blue-600 border-blue-700'
                  : 'bg-emerald-600 border-emerald-700'
            }`}>
              {toast.type === 'error' ? '⚠️' : '🎉'} {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- REPLACEMENT MODAL: ADD MONEY --- */}
      <AnimatePresence>
        {isAddMoneyOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-[#46178f] dark:text-purple-300 tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4.5 h-4.5 text-amber-500" />
                  Top Up Commuter Wallet
                </h3>
                <button
                  onClick={() => {
                    setIsAddMoneyOpen(false);
                    setAddAmount('');
                  }}
                  className="text-slate-400 hover:text-slate-600 font-bold w-6 h-6 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal font-bold uppercase">
                Select quick reload denomination or input custom amount below (Philippine Pesos):
              </p>

              {/* Quick load presets */}
              <div className="grid grid-cols-3 gap-2">
                {[20, 50, 100, 200, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePerformAddMoney(preset)}
                    className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl py-2 text-xs font-black text-[#46178f] dark:text-purple-300 cursor-pointer shadow-sm transition"
                  >
                    ₱{preset}
                  </button>
                ))}
              </div>

              {/* Custom load input field */}
              <div className="space-y-1.5 pt-1.5">
                <label className="block text-[8px] text-slate-400 uppercase font-black">
                  Enter Custom Amount (PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-xs font-black text-slate-400">₱</span>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="e.g. 50"
                    min="1"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white rounded-xl py-1.5 pl-7 pr-3 text-xs font-black focus:outline-none focus:border-[#46178f]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setIsAddMoneyOpen(false);
                    setAddAmount('');
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-550 font-black text-xs py-2 rounded-xl uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePerformAddMoney(parseFloat(addAmount))}
                  className="flex-1 bg-[#46178f] hover:bg-purple-800 text-white font-black text-xs py-2 rounded-xl uppercase transition cursor-pointer shadow border-b-2 border-purple-950"
                >
                  Confirm Topup
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- REPLACEMENT MODAL: CONFIRM COMMUTE DONE --- */}
      <AnimatePresence>
        {isCommuteDoneConfirmOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex justify-between items-center text-red-500">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-4.5 h-4.5" />
                  Complete Commute Day?
                </h3>
                <button
                  onClick={() => setIsCommuteDoneConfirmOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
                <p>Are you ready to lock in today's commute series and clear your daily card?</p>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-805 space-y-1 text-slate-700 dark:text-slate-300 font-mono">
                  <div className="flex justify-between">
                    <span>• Daily Swipes:</span>
                    <strong className="text-purple-600 dark:text-purple-300">{profile.todayTrips || 0} trips</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>• Daily Fare Deducted:</span>
                    <strong className="text-amber-500">₱{(profile.todayCost || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1 mt-1 text-rose-500 font-bold">
                    <span>• Wallet Reset To:</span>
                    <span>₱0.00</span>
                  </div>
                </div>

                <p className="text-[9px] uppercase font-bold text-slate-404 leading-normal">
                  Today's total cost & swipes will be added permanentally into your lifetime statistics in the Profile tab.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setIsCommuteDoneConfirmOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-550 font-black text-xs py-2 rounded-xl uppercase transition cursor-pointer"
                >
                  Keep riding
                </button>
                <button
                  onClick={handlePerformCommuteDone}
                  className="flex-1 bg-[#e21b3c] hover:bg-rose-700 text-white font-black text-xs py-2 rounded-xl uppercase transition cursor-pointer shadow border-b-2 border-rose-900"
                >
                  Yes, Complete Day
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MOODERIA COMMUTE DONE CELEBRATION SCREEN --- */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 bg-[#46178f] z-50 flex flex-col justify-center items-center p-6 text-white overflow-hidden select-none select-none">
            
            {/* Animated confetti floating emojis */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => {
                const colors = ['text-yellow-300', 'text-yellow-400', 'text-rose-450', 'text-green-300', 'text-cyan-300', 'text-amber-400'];
                const emojis = ['🎉', '🪙', '🎟️', '🚌', '🌟', '🚋', '💚', '⚡️'];
                const emoji = emojis[i % emojis.length];
                const color = colors[i % colors.length];
                const randomX = (i * 7) % 100; // random percentage position
                const randomDelay = (i * 0.2) % 3;
                return (
                  <motion.div
                    key={i}
                    className={`absolute text-xl ${color}`}
                    initial={{ y: -50, x: `${randomX}vw`, opacity: 0, rotate: 0 }}
                    animate={{ 
                      y: '110vh', 
                      rotate: 360, 
                      opacity: [0, 1, 1, 0] 
                    }}
                    transition={{ 
                      duration: 4 + (i % 3), 
                      repeat: Infinity, 
                      delay: randomDelay,
                      ease: 'linear'
                    }}
                  >
                    {emoji}
                  </motion.div>
                );
              })}
            </div>

            {/* Main content package wrapper */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-full max-w-sm text-center space-y-6 z-10"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-yellow-300/80 animate-wiggle">
                  <PartyPopper className="w-11 h-11 text-yellow-300" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-black font-sans tracking-widest uppercase text-yellow-300 leading-tight">
                  MABUHAY COMMUTE COMPLETED!
                </h2>
                <p className="text-[10px] uppercase font-black tracking-widest text-purple-250">
                  Philippine Commuter series locked & saved offline
                </p>
              </div>

              {/* Receipt Layout Card */}
              <div className="bg-purple-950/70 border border-purple-800 rounded-[28px] p-5 space-y-4 max-w-xs mx-auto text-left relative shadow-2xl">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-purple-950 text-[8px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                  DAILY EXPEDITURE EXPORT
                </div>

                <div className="space-y-2 pt-2.5 font-mono text-[11px] text-purple-100">
                  <p className="text-center font-sans font-black text-rose-300 text-xs tracking-wide uppercase mb-3">
                    Transit Receipt Summary
                  </p>
                  
                  <div className="flex justify-between border-b border-purple-900 pb-1.5">
                    <span>Trips Swiped:</span>
                    <strong className="text-yellow-300">{celebratedStats.trips} Trips</strong>
                  </div>

                  <div className="flex justify-between border-b border-purple-900 pb-1.5">
                    <span>Total Cost Spent:</span>
                    <strong className="text-yellow-300">₱{celebratedStats.cost.toFixed(2)}</strong>
                  </div>

                  <div className="flex justify-between pt-1 text-emerald-300 font-extrabold uppercase">
                    <span>Carbon Saved:</span>
                    <span>{(celebratedStats.trips * 0.42).toFixed(2)} KG CO₂</span>
                  </div>
                </div>

                <div className="border-t border-purple-900/60 pt-3 text-center">
                  <span className="text-[8px] uppercase tracking-wider text-purple-300 leading-normal block">
                    Remaining wallet funds reset to zero. Commute logs synced with Local Database indices.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowCelebration(false)}
                className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-purple-950 font-black text-xs px-8 py-3.5 rounded-2xl uppercase tracking-widest transition cursor-pointer shadow-lg inline-block font-bold border-b-4 border-yellow-600 block w-full max-w-xs mx-auto"
              >
                Close Receipt
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
