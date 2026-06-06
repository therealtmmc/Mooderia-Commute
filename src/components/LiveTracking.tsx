/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ActiveStats, TravelRecommendation, LocationBreadcrumb } from '../types';
import { getHaversineDistanceKm, generateIntermediatePoints } from '../utils/fareCalculator';
import { TRANSIT_LINES } from '../data/transitDatabase';
import { Play, Square, Navigation, Activity, History, Compass, CheckCircle2, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

interface LiveTrackingProps {
  activeRec: TravelRecommendation | null;
}

interface SavedRun {
  id: string;
  date: string;
  fromStopName: string;
  toStopName: string;
  distanceKm: number;
  durationMin: number;
  transitType: string;
}

export default function LiveTracking({ activeRec }: LiveTrackingProps) {
  // Tracking state
  const [stats, setModelStats] = useState<ActiveStats>({
    isTracking: false,
    isSimulated: true,
    distanceTraveledKm: 0,
    elapsedTimeSec: 0,
    currentSpeedKph: 0,
    passedStops: [],
    remainingStops: [],
    currentLocation: null,
    breadcrumbs: []
  });

  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState<number>(3); // Speed of simulation
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [tabMode, setTabMode] = useState<'track' | 'history'>('track');

  // References for timers, sensors
  const trackerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load saved runs past telemetry from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mooderia_commute_runs');
      if (stored) {
        setSavedRuns(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Local storage read failure", e);
    }
  }, []);

  // Sync canvas sketch to render offline metro vectors & visual trails
  useEffect(() => {
    drawOfflineMap();
  }, [stats.currentLocation, stats.breadcrumbs, activeRec]);

  // Clean trackers on unmount
  useEffect(() => {
    return () => {
      stopAllTracking();
    };
  }, []);

  const stopAllTracking = () => {
    if (trackerRef.current) {
      clearInterval(trackerRef.current);
      trackerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Launch live GPS tracking stream utilizing HTML5 high-accuracy geolocation
  const handleStartRealGPSTracking = () => {
    if (!navigator.geolocation) {
      setGeolocationError("Your physical browser does not support standard Geolocation modules.");
      return;
    }
    
    stopAllTracking();
    setGeolocationError(null);

    // Initial state setup
    setModelStats({
      isTracking: true,
      isSimulated: false,
      distanceTraveledKm: 0,
      elapsedTimeSec: 0,
      currentSpeedKph: 0,
      passedStops: [],
      remainingStops: activeRec ? activeRec.segments.flatMap(s => s.intermediateStops) : [],
      currentLocation: null,
      breadcrumbs: []
    });

    // Start clock timer
    timerRef.current = window.setInterval(() => {
      setModelStats(prev => ({
        ...prev,
        elapsedTimeSec: prev.elapsedTimeSec + 1
      }));
    }, 1000);

    // Setup GPS watching stream
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, accuracy } = position.coords;
        const currentSpeed = speed ? speed * 3.6 : 12; // fallback constant speed if sitting stationary

        setModelStats(prev => {
          const freshBreadcrumb: LocationBreadcrumb = {
            lat: latitude,
            lng: longitude,
            timestamp: Date.now(),
            speed: speed || 3.3,
            accuracy: accuracy || undefined
          };

          const newBreadcrumbs = [...prev.breadcrumbs, freshBreadcrumb];
          let updatedDistance = prev.distanceTraveledKm;

          if (prev.currentLocation) {
            const addedDist = getHaversineDistanceKm(
              prev.currentLocation.lat,
              prev.currentLocation.lng,
              latitude,
              longitude
            );
            // Append minor filter increments to prevent GPS jitter accumulation
            if (addedDist > 0.005) {
              updatedDistance += addedDist;
            }
          }

          // Check if user reached any upcoming stops
          let passed = [...prev.passedStops];
          let remaining = [...prev.remainingStops];

          if (remaining.length > 0) {
            // Find if user is within 250 meters of the next stop
            const nextStopObj = findStopCoordsByName(remaining[0]);
            if (nextStopObj) {
              const distanceToStop = getHaversineDistanceKm(latitude, longitude, nextStopObj.lat, nextStopObj.lng);
              if (distanceToStop < 0.25) {
                const checked = remaining.shift();
                if (checked) {
                  passed.push(checked);
                }
              }
            }
          }

          return {
            ...prev,
            currentLocation: { lat: latitude, lng: longitude },
            breadcrumbs: newBreadcrumbs,
            distanceTraveledKm: parseFloat(updatedDistance.toFixed(3)),
            currentSpeedKph: parseFloat(currentSpeed.toFixed(1)),
            passedStops: passed,
            remainingStops: remaining
          };
        });
      },
      (err) => {
        setGeolocationError(`GPS Sensor Error: ${err.message}. Defaulting back to Demo mode.`);
        handleStartSimulation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  // Launch simulated geo tracking along the chosen point-to-point stop segments
  const handleStartSimulation = () => {
    if (!activeRec || activeRec.segments.length === 0) return;

    stopAllTracking();
    setGeolocationError(null);

    // Prepare path coordinates of the whole commute
    const fullPathPoints: { lat: number; lng: number; name?: string }[] = [];
    activeRec.segments.forEach(segment => {
      const lineObj = TRANSIT_LINES.find(l => l.id === segment.lineId);
      if (lineObj) {
        // Linear path through order stops
        const isFwd = segment.fromStop.order < segment.toStop.order;
        const lineOrderedStops = lineObj.stops
          .filter(s => isFwd ? (s.order >= segment.fromStop.order && s.order <= segment.toStop.order) : (s.order >= segment.toStop.order && s.order <= segment.fromStop.order))
          .sort((a, b) => isFwd ? a.order - b.order : b.order - a.order);

        for (let i = 0; i < lineOrderedStops.length - 1; i++) {
          const from = lineOrderedStops[i];
          const to = lineOrderedStops[i+1];
          // Generate 25 smooth micro points per stop
          const intermediates = generateIntermediatePoints(from.lat, from.lng, to.lat, to.lng, 25);
          intermediates.forEach((pt, pIdx) => {
            fullPathPoints.push({
              lat: pt.lat,
              lng: pt.lng,
              name: pIdx === 0 ? from.name : (pIdx === intermediates.length - 1 ? to.name : undefined)
            });
          });
        }
      }
    });

    if (fullPathPoints.length === 0) return;

    setModelStats({
      isTracking: true,
      isSimulated: true,
      distanceTraveledKm: 0,
      elapsedTimeSec: 0,
      currentSpeedKph: 45, // default virtual pace
      passedStops: [],
      remainingStops: activeRec.segments.flatMap(s => s.intermediateStops),
      currentLocation: { lat: fullPathPoints[0].lat, lng: fullPathPoints[0].lng },
      breadcrumbs: [{ lat: fullPathPoints[0].lat, lng: fullPathPoints[0].lng, timestamp: Date.now(), speed: 12 }]
    });

    // Clock timer
    timerRef.current = window.setInterval(() => {
      setModelStats(prev => ({
        ...prev,
        elapsedTimeSec: prev.elapsedTimeSec + 1
      }));
    }, 1000);

    let pathIndex = 0;
    // Animate traveler stepping on path points
    trackerRef.current = window.setInterval(() => {
      pathIndex++;

      if (pathIndex >= fullPathPoints.length) {
        // Finished Commute trip!
        handleStopAndSave();
        return;
      }

      const activePt = fullPathPoints[pathIndex];
      
      setModelStats(prev => {
        let passed = [...prev.passedStops];
        let remaining = [...prev.remainingStops];

        if (activePt.name && remaining.includes(activePt.name)) {
          remaining = remaining.filter(r => r !== activePt.name);
          passed.push(activePt.name);
        }

        // Add a slight variability and speed swing
        const speedFluctuation = 35 + Math.sin(pathIndex / 5) * 15;

        let accumulatedDistance = prev.distanceTraveledKm;
        if (prev.currentLocation) {
          accumulatedDistance += getHaversineDistanceKm(
            prev.currentLocation.lat,
            prev.currentLocation.lng,
            activePt.lat,
            activePt.lng
          );
        }

        return {
          ...prev,
          currentLocation: { lat: activePt.lat, lng: activePt.lng },
          distanceTraveledKm: parseFloat(accumulatedDistance.toFixed(3)),
          currentSpeedKph: Math.round(speedFluctuation),
          passedStops: passed,
          remainingStops: remaining,
          breadcrumbs: [
            ...prev.breadcrumbs,
            { lat: activePt.lat, lng: activePt.lng, timestamp: Date.now(), speed: speedFluctuation / 3.6 }
          ]
        };
      });

    }, 300 / simSpeedMultiplier); // configurable pace scale
  };

  const handleStopAndSave = () => {
    // Record current stat values
    stopAllTracking();

    if (activeRec && stats.distanceTraveledKm > 0.05) {
      const newRun: SavedRun = {
        id: `run-${Date.now()}`,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        fromStopName: activeRec.segments[0].fromStop.name,
        toStopName: activeRec.segments[activeRec.segments.length - 1].toStop.name,
        distanceKm: parseFloat(stats.distanceTraveledKm.toFixed(2)),
        durationMin: Math.ceil(stats.elapsedTimeSec / 60),
        transitType: activeRec.segments[0].type
      };

      const updatedRuns = [newRun, ...savedRuns];
      setSavedRuns(updatedRuns);
      try {
        localStorage.setItem('mooderia_commute_runs', JSON.stringify(updatedRuns));
      } catch (e) {
        console.error("Local storage update error", e);
      }
    }

    setModelStats(prev => ({
      ...prev,
      isTracking: false
    }));
  };

  const findStopCoordsByName = (name: string) => {
    for (const line of TRANSIT_LINES) {
      const found = line.stops.find(s => s.name === name);
      if (found) return found;
    }
    return null;
  };

  // HTML5 visual trace pipeline for rendering lines, stops, and dynamic markers onto canvas
  const drawOfflineMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0f0c1b'; // rich brand violet depth instead of dull slate
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw coordinate map grid
    ctx.strokeStyle = '#231c38';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Determine viewport borders in Manila coordinates
    const minLat = 14.50;
    const maxLat = 14.68;
    const minLng = 120.97;
    const maxLng = 121.13;

    // Scale function
    const project = (lat: number, lng: number) => {
      // Flip Y since canvas draws top-down
      const x = ((lng - minLng) / (maxLng - minLng)) * canvas.width;
      const y = canvas.height - ((lat - minLat) / (maxLat - minLat)) * canvas.height;
      return { x, y };
    };

    // 1. Draw ALL Philippine Metro lines in translucent tracks
    TRANSIT_LINES.forEach(line => {
      ctx.beginPath();
      line.stops.forEach((stop, index) => {
        const { x, y } = project(stop.lat, stop.lng);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = line.color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    // 2. Highlight selected path segments if active
    if (activeRec) {
      activeRec.segments.forEach(segment => {
        ctx.beginPath();
        const lineObj = TRANSIT_LINES.find(l => l.id === segment.lineId);
        if (lineObj) {
          const isFwd = segment.fromStop.order < segment.toStop.order;
          const stopsInRange = lineObj.stops
            .filter(s => isFwd ? (s.order >= segment.fromStop.order && s.order <= segment.toStop.order) : (s.order >= segment.toStop.order && s.order <= segment.fromStop.order))
            .sort((a, b) => isFwd ? a.order - b.order : b.order - a.order);

          stopsInRange.forEach((stop, index) => {
            const { x, y } = project(stop.lat, stop.lng);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = segment.color;
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      });
    }

    // 3. Draw GPS Breadcrumbs path
    if (stats.breadcrumbs.length > 1) {
      ctx.beginPath();
      stats.breadcrumbs.forEach((pt, index) => {
        const { x, y } = project(pt.lat, pt.lng);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#eab308'; // yellow-500 neon breadcrumb
      ctx.lineWidth = 3.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]); // clear
    }

    // 4. Draw Stations inside active route as glowing dots
    if (activeRec) {
      activeRec.segments.forEach(seg => {
        const lineObj = TRANSIT_LINES.find(l => l.id === seg.lineId);
        if (lineObj) {
          lineObj.stops.forEach(stop => {
            const isBoardAlight = stop.id === seg.fromStop.id || stop.id === seg.toStop.id;
            const { x, y } = project(stop.lat, stop.lng);

            // Draw dot
            ctx.beginPath();
            ctx.arc(x, y, isBoardAlight ? 6 : 3.5, 0, 2 * Math.PI);
            ctx.fillStyle = isBoardAlight ? '#f43f5e' : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Label key hubs
            if (isBoardAlight || stop.name.includes('Cubao') || stop.name.includes('EDSA') || stop.name.includes('Recto')) {
              ctx.font = 'bold 9px sans-serif';
              ctx.fillStyle = '#cbd5e1';
              ctx.fillText(stop.name.split(' (')[0], x + 9, y + 3);
            }
          });
        }
      });
    }

    // 5. Present real-time Traveler pulsing indicator marker
    if (stats.currentLocation) {
      const { x, y } = project(stats.currentLocation.lat, stats.currentLocation.lng);

      // Pulsing outer ripple bubble
      const pulseRadius = 11 + Math.sin(Date.now() / 150) * 3;
      ctx.beginPath();
      ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
      ctx.fill();

      // Sharp Core center
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#facc15'; // bright yellow-400
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem('mooderia_commute_runs');
    setSavedRuns([]);
  };

  const formattedTime = (sec: number) => {
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  return (
    <div id="live-tracking-panel" className="flex flex-col h-full bg-slate-50 font-sans select-none overflow-y-auto style-scrollbar">
      
      {/* Tab Control Header */}
      <div className="bg-[#361175] border-b border-white/10 p-2 text-white shrink-0 flex gap-2">
        <button
          id="track-tab-btn"
          onClick={() => setTabMode('track')}
          className={`flex-1 py-2 text-xs font-black uppercase rounded-2xl tracking-wider transition ${
            tabMode === 'track' ? 'bg-[#9174f4] text-white shadow kahoot-btn' : 'text-violet-200 hover:bg-white/10'
          }`}
        >
          <Activity className="w-4 h-4 inline-block mr-1" /> Live Monitor
        </button>
        <button
          id="history-tab-btn"
          onClick={() => setTabMode('history')}
          className={`flex-1 py-2 text-xs font-black uppercase rounded-2xl tracking-wider transition ${
            tabMode === 'history' ? 'bg-[#9174f4] text-white shadow kahoot-btn' : 'text-violet-200 hover:bg-white/10'
          }`}
        >
          <History className="w-4 h-4 inline-block mr-1" /> Commute Logs
        </button>
      </div>

      {tabMode === 'track' ? (
        <div className="p-4 space-y-4 flex flex-col flex-1">
          
          {/* Neon Offline Mapper viewport */}
          <div className="relative rounded-3xl overflow-hidden border-4 border-slate-300 shadow bg-slate-950 flex-1 min-h-[220px] kahoot-card">
            <canvas
              ref={canvasRef}
              width={350}
              height={260}
              className="w-full h-full block"
            />
            {/* Compass badge info overlays */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-white text-[9px] px-2.5 py-1 rounded-xl font-mono font-black uppercase flex items-center gap-1.5 shadow-sm border border-slate-800">
              <Compass className="w-3.5 h-3.5 text-yellow-500 animate-spin" style={{ animationDuration: '4s' }} />
              {stats.currentLocation ? `${stats.currentLocation.lat.toFixed(4)}°N, ${stats.currentLocation.lng.toFixed(4)}°E` : 'GPS STANDBY'}
            </div>

            <div className="absolute top-3 right-3 bg-[#9174f4] text-white text-[9px] px-2.5 py-1 rounded-xl font-black uppercase shadow-sm">
              Vector Manila
            </div>

            {/* Offline notification shield banner */}
            <div className="absolute bottom-3 left-3 right-3 bg-[#26890c]/90 text-white text-[9px] p-2 px-3 rounded-2xl font-black uppercase text-center shadow-lg">
              🎯 100% On-Device Map Vectors Cache Enabled
            </div>
          </div>

          {/* Trigger Panel Controllers */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {stats.isTracking ? (
              <button
                id="stop-tracker-btn"
                onClick={handleStopAndSave}
                className="col-span-2 py-4 bg-[#e21b3c] border-b-6 border-[#a0132a] text-white text-sm font-black uppercase rounded-3xl hover:bg-[#c21733] active:translate-y-1 active:border-b-0 transition flex items-center justify-center gap-2 cursor-pointer kahoot-btn"
              >
                <Square className="w-5 h-5 fill-current text-white" /> Terminate Commute Trip
              </button>
            ) : (
              <>
                <button
                  id="start-gps-btn"
                  onClick={handleStartRealGPSTracking}
                  className="py-4 bg-[#26890c] border-b-6 border-[#185408] text-white text-xs font-black uppercase rounded-3xl hover:bg-[#1e6b0a] active:translate-y-1 active:border-b-0 transition flex flex-col items-center justify-center gap-1 cursor-pointer kahoot-btn"
                >
                  <Navigation className="w-5 h-5" /> Start Physical GPS
                </button>
                <button
                  id="start-sim-btn"
                  disabled={!activeRec}
                  onClick={handleStartSimulation}
                  className={`py-4 text-xs font-black uppercase rounded-3xl flex flex-col items-center justify-center gap-1 transition kahoot-btn ${
                    activeRec 
                      ? 'bg-[#1368ce] border-b-6 border-[#0d468b] text-white hover:bg-[#1059b0] active:translate-y-1 active:border-b-0 cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" /> Demo Ride
                </button>
              </>
            )}
          </div>

          {/* Alert GPS sensor warning */}
          {geolocationError && (
            <div className="bg-amber-100 border-2 border-amber-300 text-amber-950 p-3 rounded-2xl flex items-start gap-2 text-[10px] font-black shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>{geolocationError}</div>
            </div>
          )}

          {/* Speed settings multiplier if simulated */}
          {stats.isTracking && stats.isSimulated && (
            <div className="bg-violet-100 p-2.5 rounded-2xl flex items-center justify-between text-xs font-black text-[#46178f] shrink-0 border-2 border-violet-200">
              <span>Demo Speed:</span>
              <div className="flex gap-1.5">
                {[1, 3, 10].map(val => (
                  <button
                    id={`speed-mult-${val}`}
                    key={val}
                    onClick={() => setSimSpeedMultiplier(val)}
                    className={`px-3 py-1 rounded-xl text-[10px] uppercase font-black transition ${
                      simSpeedMultiplier === val ? 'bg-[#9174f4] text-white kahoot-btn' : 'bg-white text-violet-700 border border-violet-200'
                    }`}
                  >
                    {val}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Telemetry Numbers */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="bg-white border-2 border-slate-200 border-b-6 border-b-[#1368ce] p-3 rounded-2xl text-center kahoot-card">
              <span className="block text-[9px] uppercase font-black text-slate-400 mb-0.5">Distance</span>
              <span className="text-xs sm:text-sm font-black text-slate-800">{stats.distanceTraveledKm} km</span>
            </div>
            <div className="bg-white border-2 border-slate-200 border-b-6 border-b-[#e21b3c] p-3 rounded-2xl text-center kahoot-card">
              <span className="block text-[9px] uppercase font-black text-slate-400 mb-0.5">Elapsed</span>
              <span className="text-xs sm:text-sm font-black text-slate-800">{formattedTime(stats.elapsedTimeSec)}</span>
            </div>
            <div className="bg-white border-2 border-slate-200 border-b-6 border-b-[#26890c] p-3 rounded-2xl text-center kahoot-card">
              <span className="block text-[9px] uppercase font-black text-slate-400 mb-0.5">Pace Speed</span>
              <span className="text-xs sm:text-sm font-black text-slate-800">{stats.currentSpeedKph} km/h</span>
            </div>
          </div>

          {/* List of passed / remaining checkpoints */}
          <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 border-b-8 border-slate-300 flex-1 min-h-[140px] flex flex-col overflow-hidden shadow-sm kahoot-card">
            <span className="block text-[10px] text-gray-500 font-black uppercase tracking-wider mb-2.5 flex items-center justify-between border-b pb-1 border-slate-100">
              <span>Ride Checklist Stations</span>
              {stats.isTracking && (
                <span className="text-[#26890c] flex items-center gap-1 font-mono uppercase text-[9px] font-black">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Stream Node Active
                </span>
              )}
            </span>

            <div className="flex-1 overflow-y-auto space-y-2 style-scrollbar text-xs">
              {/* Passed list */}
              {stats.passedStops.map((stop, idx) => (
                <div id={`passed-station-${idx}`} key={`passed-${idx}`} className="flex items-center gap-2 font-black text-[#26890c] p-2 bg-[#26890c]/10 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-[#26890c] shrink-0" />
                  <span className="line-through">{stop}</span>
                  <span className="text-[9px] bg-[#26890c]/20 px-2 py-0.5 rounded uppercase font-black ml-auto">Passed</span>
                </div>
              ))}

              {/* Remaining list */}
              {stats.remainingStops.map((stop, idx) => (
                <div id={`remaining-station-${idx}`} key={`remain-${idx}`} className="flex items-center gap-2 font-black text-slate-600 p-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 shrink-0 ml-1"></span>
                  <span>{stop}</span>
                </div>
              ))}

              {!stats.isTracking && (
                <div className="py-6 text-center text-slate-400 text-xs font-black p-4">
                  Select a route & click Demo Ride to trace and list metro stations offline.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3 flex-grow overflow-y-auto style-scrollbar">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Completed Commute Logs</span>
              {savedRuns.length > 0 && (
                <button
                  id="clear-logs-btn"
                  onClick={handleClearHistory}
                  className="text-[10px] text-[#e21b3c] hover:text-[#c21733] font-black uppercase cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            {savedRuns.length === 0 ? (
              <div className="text-center py-16 text-slate-450 text-xs font-black leading-relaxed">
                🗂️ No telemetry history recorded.<br />Complete a demo route commute or use live GPS tracking to store logs locally on-device.
              </div>
            ) : (
              <div className="space-y-3">
                {savedRuns.map((run) => (
                  <div id={`history-card-${run.id}`} key={run.id} className="bg-white rounded-2xl p-4 border-2 border-slate-200 border-b-6 border-slate-300 space-y-2.5 kahoot-card">
                    <div className="flex justify-between text-[10px] text-slate-400 font-black font-mono">
                      <span>{run.date}</span>
                      <span className="bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-lg uppercase font-black text-[9px]">
                        {run.transitType}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <span>{run.fromStopName}</span>
                      <span className="text-[#9174f4]">➔</span>
                      <span>{run.toStopName}</span>
                    </div>

                    <div className="flex gap-4 font-mono text-[10px] text-slate-500 border-t pt-2 border-slate-100">
                      <div className="flex items-center gap-1 text-[#26890c]">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Distance: <strong>{run.distanceKm} km</strong></span>
                      </div>
                      <div>
                        <span>Duration: <strong>{run.durationMin} mins</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-violet-50 p-4 rounded-3xl border-2 border-violet-100 flex items-start gap-2.5 text-violet-900 text-[10px] font-black leading-relaxed shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#9174f4] shrink-0" />
            <div className="uppercase tracking-tight">
              Persistence details: Commute logs are written directly to your browser's persistent database storage, enabling 100% offline access when cellular access fails!
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
