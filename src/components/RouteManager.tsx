/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, SavedRoute } from '../lib/db';
import { TRANSIT_LINES, ALL_UNIQUE_STOPS } from '../data/transitDatabase';
import { findRoute } from '../utils/fareCalculator';
import { Plus, Trash2, Edit2, MapPin, Bus, Train, Coins, Navigation, Search, Check, X, ArrowRight, Sparkles, Filter, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RouteManagerProps {
  onRouteSelected?: (route: SavedRoute) => void;
  currentBalance?: number;
  refreshKey?: number;
}

export default function RouteManager({ onRouteSelected, currentBalance = 0, refreshKey }: RouteManagerProps) {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  
  // Filtering & searching states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal / Creator Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Creator form fields
  const [transportType, setTransportType] = useState<string>('Jeepney Route');
  const [isCustomStops, setIsCustomStops] = useState(true);
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [expenseValue, setExpenseValue] = useState<string>('13');
  const [notes, setNotes] = useState('');
  const [routeNumber, setRouteNumber] = useState('');

  // Predefined stop options depending on transport type
  const [stopsOptions, setStopsOptions] = useState<string[]>([]);

  // Toast status feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load and refresh list
  const loadRoutes = () => {
    setRoutes(db.getSavedRoutes());
  };

  useEffect(() => {
    loadRoutes();
    
    const handleDbUpdate = () => {
      loadRoutes();
    };
    
    window.addEventListener('local-db-updated', handleDbUpdate);
    return () => {
      window.removeEventListener('local-db-updated', handleDbUpdate);
    };
  }, [refreshKey]);

  // Sync stops dropdown when transport type changes in Form
  useEffect(() => {
    if (transportType === 'Jeepney Route' || transportType === 'Tricycle Route') {
      setIsCustomStops(true);
      setStopsOptions([]);
    } else {
      setIsCustomStops(false);
      let matches: string[] = [];
      if (transportType === 'MRT Routes') {
        const mrtLine = TRANSIT_LINES.find(l => l.id === 'mrt3');
        if (mrtLine) matches = mrtLine.stops.map(s => s.name);
      } else if (transportType === 'LRT Routes') {
        const lrt2 = TRANSIT_LINES.find(l => l.id === 'lrt2');
        const lrt1 = TRANSIT_LINES.find(l => l.id === 'lrt1');
        const list2 = lrt2 ? lrt2.stops.map(s => s.name) : [];
        const list1 = lrt1 ? lrt1.stops.map(s => s.name) : [];
        matches = [...list1, ...list2];
      } else if (transportType === 'Bus routes') {
        const busLine = TRANSIT_LINES.find(l => l.id === 'bus-carousel');
        if (busLine) matches = busLine.stops.map(s => s.name);
      } else if (transportType === 'UV Express') {
        matches = [
          'Fairview Terraces Hub', 'SM Fairview', 'Taft Avenue UV Terminal', 
          'Buendia UV Stop', 'Trinoma Mall UV', 'Araneta Cubao Terminal', 'Alabang Town Center'
        ];
      }
      setStopsOptions(matches);
      if (matches.length >= 2) {
        setFromStop(matches[0]);
        setToStop(matches[1]);
      } else {
        setFromStop('');
        setToStop('');
      }
    }
  }, [transportType]);

  // Auto-suggest fare price when station selections change
  useEffect(() => {
    if (transportType === 'Jeepney Route' || transportType === 'Tricycle Route') {
      return;
    }
    
    if (!fromStop || !toStop) return;

    // Find custom stop objects
    const originStop = ALL_UNIQUE_STOPS.find(s => s.name === fromStop);
    const destStop = ALL_UNIQUE_STOPS.find(s => s.name === toStop);

    if (originStop && destStop) {
      const rec = findRoute(originStop, destStop);
      if (rec) {
        setExpenseValue(Math.round(rec.totalFare).toString());
        return;
      }
    }

    if (transportType === 'UV Express') {
      const uvList = [
        'Fairview Terraces Hub', 'SM Fairview', 'Taft Avenue UV Terminal', 
        'Buendia UV Stop', 'Trinoma Mall UV', 'Araneta Cubao Terminal', 'Alabang Town Center'
      ];
      const startIdx = uvList.indexOf(fromStop);
      const endIdx = uvList.indexOf(toStop);
      if (startIdx !== -1 && endIdx !== -1) {
        const distance = Math.abs(startIdx - endIdx);
        const estFare = 45 + distance * 12; // Realistic ₱45 entry + ₱12 per station block
        setExpenseValue(estFare.toString());
      } else {
        setExpenseValue('50');
      }
    } else {
      setExpenseValue('25'); // default fallback ticket price
    }
  }, [transportType, fromStop, toStop]);

  // Handle open editor triggers
  const handleOpenEdit = (route: SavedRoute, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(route.id);
    setTransportType(route.type);
    setFromStop(route.fromStop);
    setToStop(route.toStop);
    setExpenseValue(route.expenseValue.toString());
    setNotes(route.notes || '');
    setRouteNumber(route.routeNumber || '');
    setIsFormOpen(true);
  };

  // Open clean creator
  const handleOpenNew = () => {
    setEditingId(null);
    setTransportType('Jeepney Route');
    const lastRoute = routes.length > 0 ? routes[routes.length - 1] : null;
    setFromStop(lastRoute ? lastRoute.toStop : '');
    setToStop('');
    setExpenseValue('13');
    setNotes('');
    setRouteNumber('');
    setIsFormOpen(true);
  };

  // Delete handler
  const handleDeleteRoute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    db.deleteSavedRoute(id);
    loadRoutes();
    showToast('Route removed from directory cache.', 'info');
  };

  // Save/Update action
  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStop.trim() || !toStop.trim()) {
      showToast('Origin and destination stops are required.', 'error');
      return;
    }
    if (fromStop.trim().toLowerCase() === toStop.trim().toLowerCase()) {
      showToast('Origin and destination cannot be identical.', 'error');
      return;
    }

    const fareCost = parseFloat(expenseValue) || 13;
    const generatedRouteName = `${routeNumber.trim() ? `[${routeNumber.trim()}] ` : ''}${fromStop.trim()} to ${toStop.trim()}`;

    if (editingId) {
      db.updateSavedRoute(editingId, {
        name: generatedRouteName,
        type: transportType,
        fromStop: fromStop.trim(),
        toStop: toStop.trim(),
        expenseValue: fareCost,
        routeNumber: routeNumber.trim(),
        notes: notes.trim()
      });
      showToast('Commute route updated in secure storage!', 'success');
    } else {
      db.addSavedRoute({
        name: generatedRouteName,
        type: transportType,
        fromStop: fromStop.trim(),
        toStop: toStop.trim(),
        expenseValue: fareCost,
        routeNumber: routeNumber.trim(),
        notes: notes.trim()
      });
      showToast('Congratulations! Custom route persisted to your list.', 'success');
    }

    setIsFormOpen(false);
    loadRoutes();
  };

  const getTransportIcon = (type: string) => {
    if (type.includes('LRT') || type.includes('MRT')) return <Train className="w-4 h-4 text-purple-600 dark:text-purple-300" />;
    if (type.includes('Bus')) return <Bus className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
    return <Coins className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
  };

  // Derived filtered items
  const filteredRoutes = routes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.fromStop.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.toStop.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'All' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-4">
      {/* Title block with control */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#46178f] dark:text-purple-300 flex items-center gap-1.5 mb-1.5">
            <Navigation className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            Route Manager Directory
          </h4>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-[10px] px-3.5 py-2 rounded-xl flex items-center gap-1 uppercase transition border-b-2 border-emerald-700 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add New
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#46178f] text-slate-800 dark:text-white"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold focus:outline-none focus:border-[#46178f] text-slate-700 dark:text-slate-350 max-w-[110px]"
        >
          <option value="All">All Types</option>
          <option value="Jeepney Route">Jeepney Route</option>
          <option value="Tricycle Route">Tricycle Route</option>
          <option value="UV Express">UV Express</option>
          <option value="Bus routes">Buses</option>
          <option value="LRT Routes">LRT</option>
          <option value="MRT Routes">MRT</option>
        </select>
      </div>

      {/* Routes Directory List */}
      <div className="space-y-2 max-h-[290px] overflow-y-auto style-scrollbar">
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-8 px-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
            <span className="text-xl block">📂</span>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mt-2">
              No matching routes found. Customize one above!
            </p>
          </div>
        ) : (
          filteredRoutes.map(rt => {
            const isSel = selectedRouteId === rt.id;
            const isBlocked = rt.expenseValue > currentBalance;
            return (
              <div
                key={rt.id}
                onClick={() => {
                  if (isBlocked) {
                    showToast(`Blocked: Route fare (₱${rt.expenseValue.toFixed(2)}) exceeds balance (₱${currentBalance.toFixed(2)}). Top up first!`, 'error');
                    return;
                  }
                  setSelectedRouteId(isSel ? null : rt.id);
                  if (onRouteSelected) onRouteSelected(rt);
                }}
                className={`p-3 rounded-2xl border transition duration-150 flex items-center justify-between cursor-pointer ${
                  isBlocked
                    ? 'border-slate-200/60 bg-slate-100/40 dark:bg-slate-900/25 opacity-40 cursor-not-allowed select-none'
                    : isSel 
                      ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/10' 
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 bg-slate-50/30'
                }`}
              >
                <div className="flex items-center gap-2.5 max-w-[75%]">
                  <div className="w-8 h-8 rounded-xl bg-purple-100/10 dark:bg-slate-805 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {getTransportIcon(rt.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8px] font-black uppercase text-[#46178f] dark:text-purple-300 block mb-0.5 flex items-center gap-1">
                      {rt.type} {isBlocked && <Lock className="w-2 h-2 text-rose-500 inline" />}
                    </span>
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                      {rt.name}
                    </h5>
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <span>{rt.fromStop}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                      <span>{rt.toStop}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-black font-mono tracking-tight px-2 py-0.5 rounded ${
                    isBlocked 
                      ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' 
                      : 'text-amber-500 bg-amber-50 dark:bg-amber-950/20'
                  }`}>
                    ₱{rt.expenseValue}
                  </span>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(rt, e)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteRoute(rt.id, e)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-rose-500 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Embedded Creator Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
          <form
            onSubmit={handleSaveRoute}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-2xl border border-slate-250 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto style-scrollbar"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-[#46178f] dark:text-purple-300 tracking-wider">
                {editingId ? 'Edit Commuter Route' : 'Create Commuter Route'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Transport category */}
            <div>
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Transport Category
              </label>
              <select
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-2.5 focus:outline-none focus:border-[#46178f]"
              >
                <option value="Jeepney Route">Jeepney Route</option>
                <option value="Tricycle Route">Tricycle Route</option>
                <option value="UV Express">UV Express</option>
                <option value="Bus routes">Bus Routes</option>
                <option value="LRT Routes">LRT Routes</option>
                <option value="MRT Routes">MRT Routes</option>
              </select>
            </div>

            {/* Route Number */}
            <div>
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Route Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 12A, Bus-4, JRT-1"
                value={routeNumber}
                onChange={(e) => setRouteNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#46178f]"
              />
            </div>

            {/* Route descriptive name removed - it will auto-populate as "A to B" */}

            {/* Stop selectors */}
            <div className="space-y-2">
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Depart & Alight Stations
              </label>

              {stopsOptions.length > 0 && (
                <div className="flex gap-2 bg-slate-100/85 dark:bg-slate-800 p-1 rounded-xl text-[8px] font-black uppercase mb-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomStops(false)}
                    className={`flex-1 py-1.5 rounded-lg text-center transition ${
                      !isCustomStops ? 'bg-[#46178f] text-white' : 'text-slate-500'
                    }`}
                  >
                    Use Station DB
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomStops(true)}
                    className={`flex-1 py-1.5 rounded-lg text-center transition ${
                      isCustomStops ? 'bg-[#46178f] text-white' : 'text-slate-500'
                    }`}
                  >
                    Custom Inputs
                  </button>
                </div>
              )}

              {!isCustomStops && stopsOptions.length > 0 ? (
                <div className="space-y-2">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block mb-0.5">Start Station</span>
                    <select
                      value={fromStop}
                      onChange={(e) => setFromStop(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-2 focus:outline-none"
                    >
                      {stopsOptions.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block mb-0.5">End Station</span>
                    <select
                      value={toStop}
                      onChange={(e) => setToStop(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl p-2 focus:outline-none"
                    >
                      {stopsOptions.filter(x => x !== fromStop).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={48}
                    required
                    placeholder="Origin stop..."
                    value={fromStop}
                    onChange={(e) => setFromStop(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#46178f]"
                  />
                  <input
                    type="text"
                    maxLength={48}
                    required
                    placeholder="Destination stop..."
                    value={toStop}
                    onChange={(e) => setToStop(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#46178f]"
                  />
                </div>
              )}
            </div>

            {/* Custom PHP Fare */}
            <div>
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Allocated Expense / Fare (PHP)
              </label>
              <div className="flex bg-slate-50 dark:bg-slate-800 items-center justify-between rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-750 focus-within:border-[#46178f]">
                <span className="text-slate-405 text-xs font-black">₱</span>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  required
                  value={expenseValue}
                  onChange={(e) => setExpenseValue(e.target.value.replace(/\D/g, ''))}
                  className="bg-transparent text-right text-xs font-black text-slate-800 dark:text-white focus:outline-none w-full ml-1"
                />
              </div>
            </div>

            {/* Special Instructions or tips */}
            <div>
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Custom Tip / Note (Optional)
              </label>
              <input
                type="text"
                maxLength={60}
                placeholder="e.g. Bring umbrella, Avoid MRT at 5pm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#46178f]"
              />
            </div>

            {/* Submitting blocks */}
            <div className="flex gap-2 pt-2.5">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500 font-black text-xs py-2.5 rounded-xl uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 text-white font-black text-xs py-2.5 rounded-xl uppercase transition cursor-pointer"
              >
                Save Route
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- IN-APP INLINE TOAST FEEDBACK --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
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
    </div>
  );
}
