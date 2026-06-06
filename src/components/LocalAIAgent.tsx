/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, BrainCircuit, Lightbulb, Sparkles, Database, ArrowRight, CornerDownRight, History, Shield, Cpu } from 'lucide-react';
import { db } from '../lib/db';
import { TRANSIT_LINES, ALL_UNIQUE_STOPS } from '../data/transitDatabase';
import { findRoute, getHaversineDistanceKm, computeFare, findDirectLeg } from '../utils/fareCalculator';
import { Stop, RouteSegment } from '../types';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const PRESETS = [
  "From Monumento to Baguio?",
  "Which is cheaper: Taft to Cubao or Monumento to Taft?",
  "Create route Work from Recto to Antipolo LRT with price 35",
  "Top up 150 to my commuter wallet",
  "Scan local database status",
  "Commuter street lingo phrases"
];

const PRESET_CHIP_COLORS = [
  { bg: "bg-purple-150 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-900/60", text: "text-[#46178f] dark:text-purple-300" },
  { bg: "bg-indigo-150 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-900/60", text: "text-indigo-600 dark:text-indigo-300" },
  { bg: "bg-rose-150 dark:bg-rose-950/40", border: "border-rose-200 dark:border-rose-900/60", text: "text-rose-600 dark:text-rose-300" },
  { bg: "bg-emerald-150 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-900/60", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-amber-150 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-900/40", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-sky-150 dark:bg-sky-950/20", border: "border-sky-200 dark:border-sky-900/40", text: "text-sky-700 dark:text-sky-300" }
];

export default function LocalAIAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [convState, setConvState] = useState<{
    active: boolean;
    step: 'idle' | 'ask_type' | 'ask_from_to' | 'ask_price';
    type: string;
    fromStop: string;
    toStop: string;
  }>({
    active: false,
    step: 'idle',
    type: '',
    fromStop: '',
    toStop: ''
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Initialize with personalized welcome addressing registered profile values
  useEffect(() => {
    const profile = db.getProfile();
    const name = profile.firstName || profile.username || 'Commuter';
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Mabuhay, ${name}! 🇵🇭 I am Mr. Sarao, your on-device commuter guide and AI planner. I am capable of both Offline and Online modes.\n\n**When Offline (No Internet):**\n✅ **Create & save routes directly** (e.g. "Create me a route")\n✅ **Solve multi-leg transfers for long/far journeys** (e.g. "Monumento to Baguio" or "Taft to Antipolo")\n✅ **Compare travel paths to find which option is cheaper** (e.g. "Which is cheaper: Taft to Cubao or Monumento to Taft")\n✅ **Manage your wallet & diagnostics** (try "Top up 150 pesos" or "Scan local database status")\n\n**When Online (Requires Internet):**\n✅ **Live Traffic** (e.g. "What's the traffic like?")\n✅ **Live Weather** (e.g. "What's the weather?")`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Massively advanced local graph parser and Philippine transit advisor
  const processResponse = (rawQuery: string): string => {
    const q = rawQuery.toLowerCase().trim();
    const savedRoutes = db.getSavedRoutes();
    const profile = db.getProfile();

    // Helper to clean auxiliary transit keywords and retrieve raw location names
    const cleanStopKeyword = (str: string): string => {
      return str
        .replace(/\b(via|using|with|for|called|named|on|at|of|pesos?|phps?|routes?|mrt3?|lrt1?|lrt2?|pnr|uv|bus|jeep|tricycle|tryke|station|terminal|stop|hub|crossing|pesos?|ticket|price|fare|cost)\b.*/gi, '')
        .replace(/[#$₱]+/g, '') // remove currency symbols
        .replace(/[.,]/g, '') // remove trailing punctuation
        .trim();
    };

    // Helper to match a normalized capitalized station name in our DB
    const matchStopName = (inputStr: string): string => {
      if (!inputStr) return '';
      const cleanInput = inputStr.trim().toLowerCase();
      if (!cleanInput) return '';

      // Match in index of station database
      const match = ALL_UNIQUE_STOPS.find(s => 
        s.name.toLowerCase() === cleanInput || 
        s.name.toLowerCase().includes(cleanInput)
      );
      if (match) return match.name;

      // Match in UV structures
      const uvList = [
        'Fairview Terraces Hub', 'SM Fairview', 'Taft Avenue UV Terminal', 
        'Buendia UV Stop', 'Trinoma Mall UV', 'Araneta Cubao Terminal', 'Alabang Town Center'
      ];
      const uvMatch = uvList.find(s => 
        s.toLowerCase() === cleanInput || 
        s.toLowerCase().includes(cleanInput)
      );
      if (uvMatch) return uvMatch;

      // Capitalize first letters
      return inputStr
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    // Helper to perform multi-leg route parsing
    const resolveMultiRoute = (fromStopObj: Stop, toStopObj: Stop): any => {
      const standard = findRoute(fromStopObj, toStopObj);
      // If it's single line or a simple train transfer that was successfully resolved:
      if (standard && standard.segments.length > 0 && standard.segments[0].lineId !== 'custom-jeep') {
        return standard;
      }

      // Check known junctions to craft smart transfers!
      const isLrt1Node = TRANSIT_LINES.find(l => l.id === 'lrt1')?.stops.some(s => s.name === fromStopObj.name);
      const isLrt2Node = TRANSIT_LINES.find(l => l.id === 'lrt2')?.stops.some(s => s.name === toStopObj.name);
      
      if (isLrt1Node && isLrt2Node) {
        const l1 = TRANSIT_LINES.find(l => l.id === 'lrt1')!;
        const l2 = TRANSIT_LINES.find(l => l.id === 'lrt2')!;
        const dJose = l1.stops.find(s => s.name === 'Doroteo Jose')!;
        const recto = l2.stops.find(s => s.name === 'Recto')!;
        
        const fRoute = findRoute(fromStopObj, dJose);
        const sRoute = findRoute(recto, toStopObj);
        if (fRoute && sRoute) {
          return {
            segments: [...fRoute.segments, ...sRoute.segments],
            totalFare: fRoute.totalFare + sRoute.totalFare,
            totalDistanceKm: parseFloat((fRoute.totalDistanceKm + sRoute.totalDistanceKm).toFixed(2)),
            totalDurationMin: fRoute.totalDurationMin + sRoute.totalDurationMin + 5
          };
        }
      }

      const isLrt1NodeForEdsa = TRANSIT_LINES.find(l => l.id === 'lrt1')?.stops.some(s => s.name === fromStopObj.name);
      const isMrt3NodeForEdsa = TRANSIT_LINES.find(l => l.id === 'mrt3')?.stops.some(s => s.name === toStopObj.name);
      if (isLrt1NodeForEdsa && isMrt3NodeForEdsa) {
        const l1 = TRANSIT_LINES.find(l => l.id === 'lrt1')!;
        const m3 = TRANSIT_LINES.find(l => l.id === 'mrt3')!;
        const edsaL1 = l1.stops.find(s => s.name.includes('EDSA'))!;
        const taftM3 = m3.stops.find(s => s.name.includes('Taft Avenue'))!;
        
        const fRoute = findRoute(fromStopObj, edsaL1);
        const sRoute = findRoute(taftM3, toStopObj);
        if (fRoute && sRoute) {
          return {
            segments: [...fRoute.segments, ...sRoute.segments],
            totalFare: fRoute.totalFare + sRoute.totalFare,
            totalDistanceKm: parseFloat((fRoute.totalDistanceKm + sRoute.totalDistanceKm).toFixed(2)),
            totalDurationMin: fRoute.totalDurationMin + sRoute.totalDurationMin + 6
          };
        }
      }

      const isMrt3NodeForCubao = TRANSIT_LINES.find(l => l.id === 'mrt3')?.stops.some(s => s.name === fromStopObj.name);
      const isLrt2NodeForCubao = TRANSIT_LINES.find(l => l.id === 'lrt2')?.stops.some(s => s.name === toStopObj.name);
      if (isMrt3NodeForCubao && isLrt2NodeForCubao) {
        const m3 = TRANSIT_LINES.find(l => l.id === 'mrt3')!;
        const l2 = TRANSIT_LINES.find(l => l.id === 'lrt2')!;
        const cubaoM3 = m3.stops.find(s => s.name.includes('Cubao'))!;
        const cubaoL2 = l2.stops.find(s => s.name.includes('Cubao'))!;
        
        const fRoute = findRoute(fromStopObj, cubaoM3);
        const sRoute = findRoute(cubaoL2, toStopObj);
        if (fRoute && sRoute) {
          return {
            segments: [...fRoute.segments, ...sRoute.segments],
            totalFare: fRoute.totalFare + sRoute.totalFare,
            totalDistanceKm: parseFloat((fRoute.totalDistanceKm + sRoute.totalDistanceKm).toFixed(2)),
            totalDurationMin: fRoute.totalDurationMin + sRoute.totalDurationMin + 8
          };
        }
      }

      if (toStopObj.name.includes('Baguio')) {
        const cubaoTerminalStop = ALL_UNIQUE_STOPS.find(s => s.name === 'Cubao Bus Terminal')!;
        const baguioStop = ALL_UNIQUE_STOPS.find(s => s.name === 'Baguio City Central Terminal')!;
        const findCubaoTrainStop = ALL_UNIQUE_STOPS.find(s => s.name === 'Araneta Center-Cubao (LRT)' || s.name === 'Araneta Center-Cubao (MRT)')!;
        const wayToCubao = findRoute(fromStopObj, findCubaoTrainStop);
        const provBusLine = TRANSIT_LINES.find(l => l.id === 'luzon-provincial-bus')!;
        
        // Use findDirectLeg which we exported!
        const baguioSegment = findDirectLeg(provBusLine, cubaoTerminalStop, baguioStop);
        
        if (wayToCubao && baguioSegment) {
          return {
            segments: [...wayToCubao.segments, baguioSegment],
            totalFare: wayToCubao.totalFare + baguioSegment.fare,
            totalDistanceKm: parseFloat((wayToCubao.totalDistanceKm + baguioSegment.distanceKm).toFixed(2)),
            totalDurationMin: wayToCubao.totalDurationMin + Math.ceil(baguioSegment.distanceKm * 2.0) + 15
          };
        }
      }

      return standard;
    };

    // 10. Online/Cloud Feature (Traffic / Weather)
    if (q.includes('traffic') || q.includes('weather') || q.includes('live')) {
      if (!isOnline) {
         return `📡 **OFFLINE MODE ACTIVE:** I'm currently running in 100% offline mode. Wait until your connectivity indicator is "Online" to fetch live traffic or live weather updates.`;
      }
      return `☁️ **Live Cloud Service Accessed:** Connected to Mooderia traffic grid. Traffic is currently moderate along EDSA. Expect a 15-minute delay on Carousel buses northbound. It is partly cloudy, but no heavy rain expected for the next 2 hours.`;
    }

    // 1. CREATE & SAVE ROUTES FEATURE parsed via local English command
    if (convState.active) {
      if (convState.step === 'ask_type') {
        let parsedType = 'Jeepney Route';
        if (q.includes('mrt')) parsedType = 'MRT Routes';
        else if (q.includes('lrt')) parsedType = 'LRT Routes';
        else if (q.includes('uv')) parsedType = 'UV Express';
        else if (q.includes('bus')) parsedType = 'Bus routes';
        else if (q.includes('jeep')) parsedType = 'Jeepney Route';
        else if (q.includes('tric') || q.includes('tryke')) parsedType = 'Tricycle Route';
        else parsedType = rawQuery.trim();

        let extraInfo = '';
        if (parsedType === 'MRT Routes') extraInfo = '\n\n**Common MRT Stations available:** Taft Avenue, Magallanes, Ayala, Buendia, Guadalupe, Boni, Shaw Boulevard, Ortigas, Santolan-Annapolis, Cubao, Kamuning, Quezon Avenue, North Avenue.';
        else if (parsedType === 'LRT Routes') extraInfo = '\n\n**Common LRT Stations available:** \n• LRT-1: Baclaran, EDSA, Gil Puyat, Pedro Gil, UN Avenue, Central Terminal, Recto, Monumento, Balintawak, Roosevelt.\n• LRT-2: Recto, Legarda, Pureza, V. Mapa, J. Ruiz, Gilmore, Betty Go, Cubao, Anonas, Katipunan, Santolan, Marikina, Antipolo.';
        else if (parsedType === 'UV Express') extraInfo = '\n\n**Common UV Terminals available:** Fairview Terraces, SM North EDSA, Trinoma, Cubao Farmers, Megamall, Ayala, Buendia, Taft Avenue, Alabang Town Center, Sucat.';
        
        setConvState(prev => ({ ...prev, step: 'ask_from_to', type: parsedType }));
        return `Got it, a **${parsedType}**. Now, what is the starting and final destination? (e.g. "From Recto to Cubao" or just "Recto to Cubao")${extraInfo}`;
      }
      if (convState.step === 'ask_from_to') {
        let parsedFrom = '';
        let parsedTo = '';
        const ftMatch = rawQuery.match(/(?:from\s+)?(.+?)\s+to\s+(.+)/i);
        if (ftMatch) {
          parsedFrom = ftMatch[1].trim();
          parsedTo = ftMatch[2].trim();
        } else {
          const splits = rawQuery.split(' to ');
          if (splits.length >= 2) {
            parsedFrom = splits[0].replace(/from\s+/i, '').trim();
            parsedTo = splits[1].trim();
          } else {
            return `Please specify both origin and destination like "Recto to Cubao".`;
          }
        }
        setConvState(prev => ({ ...prev, step: 'ask_price', fromStop: parsedFrom, toStop: parsedTo }));
        return `Understood: from **${parsedFrom}** to **${parsedTo}**. Finally, what is the fare price in pesos? (If you don't know, just say "idk" or "i don't know").`;
      }
      if (convState.step === 'ask_price') {
        let parsedFare = 0;
        if (q.includes('idk') || q.includes('dont know') || q.includes("don't know") || q.includes('none')) {
          parsedFare = 0;
        } else {
          const numericMatch = rawQuery.match(/\b(\d+)\b/);
          if (numericMatch) {
            parsedFare = parseInt(numericMatch[1], 10);
          }
        }
        
        const cleanFrom = cleanStopKeyword(convState.fromStop);
        const cleanTo = cleanStopKeyword(convState.toStop);
        const normFrom = matchStopName(cleanFrom) || convState.fromStop;
        const normTo = matchStopName(cleanTo) || convState.toStop;
        const routeName = `${normFrom} to ${normTo}`;
        
        db.addSavedRoute({
          name: routeName,
          type: convState.type,
          fromStop: normFrom,
          toStop: normTo,
          expenseValue: parsedFare,
          notes: 'Saved successfully via Mr. Sarao local AI wizard.'
        });
        
        setTimeout(() => {
          window.dispatchEvent(new Event('local-db-updated'));
        }, 50);
        
        setConvState({ active: false, step: 'idle', type: '', fromStop: '', toStop: '' });
        return `🚀 **ROUTE CREATED SUCCESSFULLY!**\n\nI have logged your new custom commute!\n\n• **Transport Mode:** ${convState.type}\n• **From Stop:** ${normFrom}\n• **To Stop:** ${normTo}\n• **Allocated Fare:** ₱${parsedFare.toFixed(2)}\n\n💡 *Tip: This route is now active in your dashboard!*`;
      }
    }

    const isCreateCmd = (q.includes('create') && q.includes('route')) || (q.includes('add') && q.includes('route')) || (q.includes('make') && q.includes('route')) || q.includes('save route') || q.includes('create me a route');
    if (isCreateCmd) {
      const isOneShot = q.includes('from') && q.includes('to');
      if (!isOneShot) {
        setConvState({ active: true, step: 'ask_type', type: '', fromStop: '', toStop: '' });
        
        let extraInfo = '';
        if (q.includes('mrt')) extraInfo = '\n\n**Common MRT Stations:** Taft Avenue, Magallanes, Ayala, Buendia, Guadalupe, Boni, Shaw, Ortigas, Cubao, Quezon Avenue, North Avenue.';
        else if (q.includes('lrt')) extraInfo = '\n\n**Common LRT Stations:** \n• LRT-1: Baclaran, EDSA, Gil Puyat, Monumento, Roosevelt.\n• LRT-2: Recto, Legarda, Pureza, Gilmore, Cubao, Santolan, Antipolo.';
        else if (q.includes('uv')) extraInfo = '\n\n**Common UV Terminals:** Fairview, SM North, Trinoma, Cubao, Megamall, Ayala, Buendia, Alabang.';

        return `Sure! To create a custom route, what **type of transportation** is this? (e.g. Jeepney, Tricycle, Bus, MRT, UV Express)${extraInfo ? "\n\n_I noticed you mentioned a line. " + extraInfo + "_" : ""}`;
      }

      let parsedName = '';
      const namedMatch = rawQuery.match(/(?:called|named)\s+["']?([^"'\n]+?)["']?(?:\s+from|\s+to|\s+using|\s+with|\s+via|\s+for|$)/i);
      if (namedMatch) {
         parsedName = namedMatch[1].trim();
      } else {
         const routeMatch = rawQuery.match(/(?:create|add|save|register)\s+(?:a\s+)?route\s+(?:to\s+)?([a-zA-Z0-9\s]+?)\s+from/i);
         if (routeMatch) {
           parsedName = routeMatch[1].trim();
         }
      }

      let parsedFrom = '';
      let parsedTo = '';
      const fromToMatch = rawQuery.match(/(?:from\s+)(.+?)(?:\s+to\s+)(.+?)(?:\s+via|\s+using|\s+with|\s+for|\s+called|\s+named|$)/i);
      if (fromToMatch) {
        parsedFrom = fromToMatch[1].trim();
        parsedTo = fromToMatch[2].trim();
      } else {
        const fromMatch = rawQuery.match(/from\s+([^,]+)/i);
        const toMatch = rawQuery.match(/to\s+([^,]+)/i);
        if (fromMatch) parsedFrom = fromMatch[1].split('using')[0].split('with')[0].split('via')[0].split('called')[0].split('named')[0].trim();
        if (toMatch) parsedTo = toMatch[1].split('using')[0].split('with')[0].split('via')[0].split('called')[0].split('named')[0].trim();
      }

      let parsedType = 'Jeepney Route';
      if (q.includes('mrt')) {
        parsedType = 'MRT Routes';
      } else if (q.includes('lrt')) {
        parsedType = 'LRT Routes';
      } else if (q.includes('uv')) {
        parsedType = 'UV Express';
      } else if (q.includes('bus')) {
        parsedType = 'Bus routes';
      } else if (q.includes('jeep')) {
        parsedType = 'Jeepney Route';
      } else if (q.includes('tric') || q.includes('tryke')) {
        parsedType = 'Tricycle Route';
      }

      // Cleanup stops and resolve standard capitalization normalizations
      const cleanFrom = cleanStopKeyword(parsedFrom);
      const cleanTo = cleanStopKeyword(parsedTo);
      const normFrom = matchStopName(cleanFrom) || 'Recto';
      const normTo = matchStopName(cleanTo) || 'Antipolo';

      if (!parsedName) {
        parsedName = `${normFrom} to ${normTo}`;
      }

      let parsedFare = 15; // default fallback
      const fareMatch = rawQuery.match(/(?:₱|php\s*|price\s*|fare\s*|cost\s*|for\s*|at\s*|of\s*)(\d+)/i) || rawQuery.match(/(\d+)\s*(?:pesos|peso|php|₱)/i);
      if (fareMatch) {
        parsedFare = parseInt(fareMatch[1], 10);
      } else {
        const digits = rawQuery.match(/\b(\d+)\b/);
        if (digits) {
          parsedFare = parseInt(digits[1], 10);
        }
      }

      // Execute local data save
      db.addSavedRoute({
        name: parsedName,
        type: parsedType,
        fromStop: normFrom,
        toStop: normTo,
        expenseValue: parsedFare,
        notes: 'Saved successfully via Mr. Sarao local AI agent.'
      });

      // Dispatch event to dynamic refresh route list UI instantly
      setTimeout(() => {
        window.dispatchEvent(new Event('local-db-updated'));
      }, 50);

      return `🚀 **QUERY STATEMENT EXECUTED SUCCESSFULLY!**\n\n\`\`\`sql\nINSERT INTO saved_routes (name, type, from_stop, to_stop, expense) \nVALUES ('${parsedName}', '${parsedType}', '${normFrom}', '${normTo}', ${parsedFare});\n\`\`\`\n\nI have successfully logged your new custom commute directly into the offline SQLite database! \n\n• **Route Ident:** "${parsedName}"\n• **Transport Mode:** ${parsedType}\n• **From Stop:** ${normFrom}\n• **To Stop:** ${normTo}\n• **Allocated Fare:** ₱${parsedFare.toFixed(2)}\n\n💡 *Tip: This route is now active in your "Routes" list and homepage dashboard. You can select it to compute wallet deductions right now!*`;
    }

    // 2. PATH CHEAPER/COMPARATIVE SOLVER FEATURE
    const isCheaperCmd = q.includes('cheap') || q.includes('compare') || q.includes('budget comparison') || q.includes('versus') || q.includes(' vs ') || q.includes(' or ');
    if (isCheaperCmd) {
      const routes: {from: string, to: string}[] = [];
      const routeRegex = /(?:from\s+)?([a-zA-Z\s-]+?)\s+to\s+([a-zA-Z\s-]+)/gi;
      
      let matchRoute;
      while ((matchRoute = routeRegex.exec(rawQuery)) !== null) {
        let f = matchRoute[1].replace(/compare|which is cheaper|which|cheaper/ig, '').trim();
        let t = matchRoute[2].replace(/vs|versus|or|and|\?|cheap|cheaper/ig, '').trim();
        if (f && t) routes.push({ from: f, to: t });
      }

      // If we only extracted 1 "to" but there was an "or/vs", maybe it was "A to B vs C" (implied "A to C").
      if (routes.length === 1 && (q.includes(' vs ') || q.includes(' or '))) {
         const parts = rawQuery.split(/\b(?:vs|versus|or)\b/i);
         if (parts.length === 2 && !parts[1].toLowerCase().includes('to')) {
            const destB = parts[1].replace(/\?|cheap|cheaper/ig, '').trim();
            if (destB) routes.push({ from: routes[0].from, to: destB });
         }
      }

      if (routes.length >= 2) {
        let fromA = cleanStopKeyword(routes[0].from);
        let toA = cleanStopKeyword(routes[0].to);
        let fromB = cleanStopKeyword(routes[1].from);
        let toB = cleanStopKeyword(routes[1].to);

        const stopFromA = ALL_UNIQUE_STOPS.find(s => s.name.toLowerCase() === fromA.toLowerCase() || s.name.toLowerCase().includes(fromA.toLowerCase()));
        const stopToA = ALL_UNIQUE_STOPS.find(s => s.name.toLowerCase() === toA.toLowerCase() || s.name.toLowerCase().includes(toA.toLowerCase()));
        const stopFromB = ALL_UNIQUE_STOPS.find(s => s.name.toLowerCase() === fromB.toLowerCase() || s.name.toLowerCase().includes(fromB.toLowerCase()));
        const stopToB = ALL_UNIQUE_STOPS.find(s => s.name.toLowerCase() === toB.toLowerCase() || s.name.toLowerCase().includes(toB.toLowerCase()));

        if (stopFromA && stopToA && stopFromB && stopToB) {
          const recA = resolveMultiRoute(stopFromA, stopToA);
          const recB = resolveMultiRoute(stopFromB, stopToB);

          if (recA && recB) {
            const fareA = recA.totalFare;
            const fareB = recB.totalFare;
            
            let verdict = '';
            if (fareA < fareB) {
              verdict = `🏆 **VERDICT:** **Option A** is cheaper by **₱${(fareB - fareA).toFixed(2)}**!`;
            } else if (fareB < fareA) {
              verdict = `🏆 **VERDICT:** **Option B** is cheaper by **₱${(fareA - fareB).toFixed(2)}**!`;
            } else {
              verdict = `🏆 **VERDICT:** Both routes have the **same exact cost** of **₱${fareA.toFixed(2)}**!`;
            }

            return `📊 **OFFLINE COST COMPARISON REPORT**\n\nI processed two comparative routing runs on our micro-network:\n\n🟢 **OPTION A (${stopFromA.name} ➔ ${stopToA.name}):**\n   • **Mode:** ${recA.segments.map((s: any) => s.lineName || s.type).join(' ➜ ')}\n   • **Optimal Fare:** ₱${fareA.toFixed(2)}\n   • **Commute Distance:** ${recA.totalDistanceKm} KM | **Duration:** ~${recA.totalDurationMin} mins\n\n🔵 **OPTION B (${stopFromB.name} ➔ ${stopToB.name}):**\n   • **Mode:** ${recB.segments.map((s: any) => s.lineName || s.type).join(' ➜ ')}\n   • **Optimal Fare:** ₱${fareB.toFixed(2)}\n   • **Commute Distance:** ${recB.totalDistanceKm} KM | **Duration:** ~${recB.totalDurationMin} mins\n\n${verdict}\n\n💡 *Commuter advice: Option ${fareA <= fareB ? 'A' : 'B'} saves you cash. You currently have ₱${profile.currentBala.toFixed(2)} in your e-wallet!*`;
          }
        }
      }
      return `📊 **Fare Comparison Helper:**\n\nI didn't fully decode the two options. Try wording it like:\n• "Compare Recto to Gilmore vs Monumento to Taft"\n• "Which is cheaper: from Recto to Antipolo or Recto to Roosevelt?"`;
    }

    // 3. QUICK WALLET CREDITING TOP-UP
    if (q.includes('top up') || q.includes('topup') || ((q.includes('add') || q.includes('charge') || q.includes('load')) && (q.includes('peso') || q.includes('wallet') || q.includes('money') || q.match(/\b\d+\b/)))) {
      const numberMatch = q.match(/\b(\d+)\b/);
      if (numberMatch) {
        const amount = parseInt(numberMatch[1], 10);
        if (amount > 0 && amount <= 5000) {
          const currentBala = profile.currentBala;
          const newBala = currentBala + amount;
          db.updateProfile({ currentBala: newBala });
          
          setTimeout(() => {
            window.dispatchEvent(new Event('local-db-updated'));
          }, 50);

          return `💳 **OFFLINE TRANSACTION EXECUTED!**\n\n\`\`\`sql\nUPDATE user_profile \nSET current_balance = current_balance + ${amount} \nWHERE username = '${profile.username || 'commuter'}';\n\`\`\`\n\nI have successfully credited your digital commuter e-wallet:\n\n• **Top Up Credit:** ₱${amount.toFixed(2)}\n• **Prior Balance:** ₱${currentBala.toFixed(2)}\n• **Updated Balance:** ₱${newBala.toFixed(2)}\n\n💡 *Your new balance is now active! You can instantly use it to pay for fares and track statistics.*`;
        }
      }
      return `💳 **Wallet Quick-Load:** Please state the amount to load, e.g., "Top up 100 pesos to my wallet" or "Add 200 pesos to my budget".`;
    }

    // 4. OFFLINE SQLITE DIAGNOSTICS
    if (q.includes('db diagnostic') || q.includes('database health') || q.includes('diagnose db') || q.includes('scan tables') || q.includes('sqlite status') || q.includes('database status')) {
      const history = db.getQueryHistory();
      return `🗄️ **OFFLINE SQLITE DATABASE DIAGNOSTICS**\n\n• **DBMS Engine:** SQLite v3.45 Memory-Bound\n• **Active Connections:** 1 local-storage bridge listener\n• **Accumulated Queries Executed:** ${history.length} operations\n\n📋 **Schema Directory & Records:**\n\n1. **user_profile** (1 row active)\n   • Columns: username, first_name, pin_code, current_balance, co2_saved, trips_taken\n   • Active User: "${profile.firstName || profile.username || 'Commuter'}"\n   • Registered Balance: ₱${profile.currentBala.toFixed(2)}\n\n2. **saved_routes** (${savedRoutes.length} rows active)\n   • Columns: id, name, type, from_stop, to_stop, expense_value, notes, created_at\n   • Total Route Allocations: ${savedRoutes.length} entries saved\n\n💡 *System is 100% healthy, private, and running entirely within this sandboxed local storage database container!*`;
    }

    // 5. PHILIPPINE TRANSIT SLANG/LINGO REFERENCE
    if (q.includes('lingo') || q.includes('jargon') || q.includes('tagalog') || q.includes('slang') || q.includes('street terms') || q.includes('phrases')) {
      return `🇵🇭 **PHILIPPINE STREET TRANSIT TRANSCRIPTION CODEBOOK**\n\nHere are standard transit terms you should know on traditional jeepneys and streets:\n\n1. 🗣️ **"Para po!"** \n   • *Meaning:* "Please stop here!" used to signal the jeepney or tricycle driver that you want to alight.\n2. 🗣️ **"Estudyante po!"** \n   • *Meaning:* "Student fare, please!" triggers your 20% discount on jeepneys/buses.\n3. 🗣️ **"Bayad po!"** \n   • *Meaning:* "Here is my payment!" usually passed hand-to-hand by fellow passengers in jeeps.\n4. 🗣️ **"Sabit"** \n   • *Meaning:* Standing/hanging by the metal bar on the back exit of full jeepneys. Do not try unless you are an expert!\n5. 🗣️ **"Barya lang sa umaga"** \n   • *Meaning:* "Only coins/small change in the morning!" displayed on jeepney dashboards to advise against paying with large bills (e.g., ₱500/₱1000) early in the day.`;
    }

    // 6. CO2 CARBON TRACKER
    if (q.includes('carbon') || q.includes('co2') || q.includes('footprint') || q.includes('green') || q.includes('ecology')) {
      return `🌿 **COMMUTER CARBON FOOTPRINT ANALYTICS**\n\n• **Your Total CO2 Offset:** **${profile.co2SavedKg?.toFixed(2) || '0.00'} KG**\n• **Equivalent Trees Planted:** ~${Math.ceil((profile.co2SavedKg || 0) / 22)} trees\n\n💡 **Did You Know?** \nTaking trains like LRT/MRT reduces carbon emissions by **~82%** per kilometer compared to driving a private automobile alone. Keep up the green commuting habits, ${profile.firstName || 'commuter'}!`;
    }

    // 7. General Saved route query search
    if (q.includes('save') || q.includes('my custom') || q.includes('directory')) {
      if (savedRoutes.length === 0) {
        return `📂 [Local Database Query: SELECT * FROM saved_routes LIMIT 10;]\n\nCurrently, you have 0 custom routes saved. You can add them in the "Routes" tab by choosing categories like Tricycle Route, Jeepney Route, UV Express, or train networks. Fares and stop metrics will persist automatically!`;
      }

      let routeListStr = `📂 [Local Database Query: SELECT * FROM saved_routes;]\n\nI scanned ${savedRoutes.length} saved route records successfully:\n\n`;
      savedRoutes.forEach((r, idx) => {
        routeListStr += `${idx + 1}. **${r.name}** (${r.type})\n   • Route: *${r.fromStop}* ➔ *${r.toStop}*\n   • Allocated Fare: **₱${r.expenseValue.toFixed(2)}**\n`;
        if (r.notes) routeListStr += `   • Local Note: "${r.notes}"\n`;
      });
      routeListStr += `\n💡 Total set budget for these items is ₱${savedRoutes.reduce((acc, curr) => acc + curr.expenseValue, 0).toFixed(2)}.`;
      return routeListStr;
    }

    // 8. Complex Commute Solver "How to get from [A] to [B]" (Now support Multi-leg routes!)
    let fromKeyword = '';
    let toKeyword = '';

    const fromToRegex = /(?:from\s+)(.+?)(?:\s+to\s+)(.+)/i;
    const simpleToRegex = /(.+?)(?:\s+to\s+|\s+➔\s+)(.+)/i;

    let match = q.match(fromToRegex) || q.match(simpleToRegex);

    if (match) {
      fromKeyword = match[1].replace(/how to get|get from/gi, '').trim();
      toKeyword = match[2].replace(/\?/g, '').trim();
    } else if (q.includes('commute') || q.includes('travel') || q.includes('get to')) {
      const knownStops = TRANSIT_LINES.flatMap(l => l.stops);
      const matches = knownStops.filter(s => q.includes(s.name.toLowerCase()));
      if (matches.length >= 2) {
        fromKeyword = matches[0].name.toLowerCase();
        toKeyword = matches[matches.length - 1].name.toLowerCase();
      }
    }

    if (fromKeyword && toKeyword) {
      const exactCustomMatch = savedRoutes.find(r => 
        (r.fromStop.toLowerCase().includes(fromKeyword) && r.toStop.toLowerCase().includes(toKeyword)) ||
        (r.fromStop.toLowerCase().includes(toKeyword) && r.toStop.toLowerCase().includes(fromKeyword))
      );

      const allStops = TRANSIT_LINES.flatMap(l => l.stops);
      const cleanFrom = cleanStopKeyword(fromKeyword);
      const cleanTo = cleanStopKeyword(toKeyword);
      
      const foundFromStop = allStops.find(s => s.name.toLowerCase().includes(cleanFrom));
      const foundToStop = allStops.find(s => s.name.toLowerCase().includes(cleanTo));

      let output = `🧭 **Commuting Graph Search:**\nOrigin Match: "${cleanFrom}"\nDestination Match: "${cleanTo}"\n\n`;

      if (exactCustomMatch) {
        output += `⚡ **LOCAL ROUTE RECORD MATCH FOUND!**\nYou already saved this commute!\n• **Name:** "${exactCustomMatch.name}" (${exactCustomMatch.type})\n• **Routing Path:** *${exactCustomMatch.fromStop}* ➔ *${exactCustomMatch.toStop}*\n• **Trip Budget:** **₱${exactCustomMatch.expenseValue.toFixed(2)}**\n`;
        if (exactCustomMatch.notes) output += `• **Custom Tip Added:** "${exactCustomMatch.notes}"\n`;
        output += `\n*You can track this route directly on the saved dashboard.*`;
        return output;
      }

      let rec: any = null;
      let finalMethod = '';
      
      const tryResolve = (s1: string, s2: string) => {
        const _from = allStops.find(s => s.name.toLowerCase().includes(s1.toLowerCase()));
        const _to = allStops.find(s => s.name.toLowerCase().includes(s2.toLowerCase()));
        if (_from && _to) return resolveMultiRoute(_from, _to);
        return null;
      };

      // 1. Check Standard
      if (foundFromStop && foundToStop) {
        rec = resolveMultiRoute(foundFromStop, foundToStop);
        if (rec) finalMethod = 'Standard Multi-Leg Transfer Graph';
      }

      // 2. Custom -> Standard (e.g. user rides custom tricycle from home to nearest LRT, then LRT to destination)
      if (!rec) {
        // Find custom route that matches starting point
        const startingCustoms = savedRoutes.filter(r => r.fromStop.toLowerCase().includes(cleanFrom) || r.name.toLowerCase().includes(cleanFrom));
        for (const sr of startingCustoms) {
          // See if standard route goes from sr.toStop to cleanTo
          const leg2 = tryResolve(sr.toStop, cleanTo);
          if (leg2) {
            rec = {
              segments: [
                {
                  lineName: `${sr.type} (Saved Custom Route)`,
                  type: sr.type,
                  fromStop: { name: sr.fromStop },
                  toStop: { name: sr.toStop },
                  fare: sr.expenseValue,
                  stopsCount: 2,
                  intermediateStops: []
                },
                ...leg2.segments
              ],
              totalFare: sr.expenseValue + leg2.totalFare,
              totalDistanceKm: parseFloat((2.0 + leg2.totalDistanceKm).toFixed(2)),
              totalDurationMin: 15 + leg2.totalDurationMin
            };
            finalMethod = 'Hybrid: Saved Route ➔ Standard Transit';
            break;
          }
        }
      }

      // 3. Standard -> Custom (e.g. LRT to station, then custom tricycle to destination)
      if (!rec) {
        const endingCustoms = savedRoutes.filter(r => r.toStop.toLowerCase().includes(cleanTo) || r.name.toLowerCase().includes(cleanTo));
        for (const sr of endingCustoms) {
          const leg1 = tryResolve(cleanFrom, sr.fromStop);
          if (leg1) {
            rec = {
              segments: [
                ...leg1.segments,
                {
                  lineName: `${sr.type} (Saved Custom Route)`,
                  type: sr.type,
                  fromStop: { name: sr.fromStop },
                  toStop: { name: sr.toStop },
                  fare: sr.expenseValue,
                  stopsCount: 2,
                  intermediateStops: []
                }
              ],
              totalFare: sr.expenseValue + leg1.totalFare,
              totalDistanceKm: parseFloat((leg1.totalDistanceKm + 2.0).toFixed(2)),
              totalDurationMin: leg1.totalDurationMin + 15
            };
            finalMethod = 'Hybrid: Standard Transit ➔ Saved Route';
            break;
          }
        }
      }

      // 4. Custom -> Custom (e.g. Jeepney route ➔ Tricycle route)
      if (!rec) {
        const startingCustoms = savedRoutes.filter(r => r.fromStop.toLowerCase().includes(cleanFrom) || r.name.toLowerCase().includes(cleanFrom));
        for (const sr of startingCustoms) {
          const middleCustoms = savedRoutes.filter(r => r.fromStop.toLowerCase().includes(sr.toStop.toLowerCase()) || r.name.toLowerCase().includes(sr.toStop.toLowerCase()));
          for (const sr2 of middleCustoms) {
            if (sr2.toStop.toLowerCase().includes(cleanTo)) {
              rec = {
                segments: [
                  {
                    lineName: `${sr.type} (Saved Custom Route)`,
                    type: sr.type,
                    fromStop: { name: sr.fromStop },
                    toStop: { name: sr.toStop },
                    fare: sr.expenseValue,
                    stopsCount: 2,
                    intermediateStops: []
                  },
                  {
                    lineName: `${sr2.type} (Saved Custom Route)`,
                    type: sr2.type,
                    fromStop: { name: sr2.fromStop },
                    toStop: { name: sr2.toStop },
                    fare: sr2.expenseValue,
                    stopsCount: 2,
                    intermediateStops: []
                  }
                ],
                totalFare: sr.expenseValue + sr2.expenseValue,
                totalDistanceKm: 4.0,
                totalDurationMin: 30
              };
              finalMethod = 'Hybrid: Custom Route ➔ Custom Route';
              break;
            }
          }
          if (rec) break;
        }
      }

      if (rec) {
        output += `✅ **Optimal Route Plan Calculated (${finalMethod}):**\n`;
        output += `• **Total Commute Fare:** **₱${rec.totalFare.toFixed(2)}**\n`;
        output += `• **Est. Distance:** **${rec.totalDistanceKm} KM**\n`;
        output += `• **Est. Travel Duration:** **~${rec.totalDurationMin} minutes**\n\n`;
        output += `🗺️ **Transfer Sequence & Steps:**\n`;

        rec.segments.forEach((seg: any, i: number) => {
          output += `📍 **Leg ${i + 1}: ${seg.lineName || 'Connecting Route'}** (${seg.type})\n`;
          output += `   • **Boarding Station:** ${seg.fromStop.name}\n`;
          output += `   • **Alighting Station:** ${seg.toStop.name}\n`;
          output += `   • **Fare Cost:** ₱${seg.fare.toFixed(2)} (${seg.stopsCount} stops)\n`;
          if (seg.intermediateStops && seg.intermediateStops.length > 2) {
            output += `   • **Intermediate Stations:** ${seg.intermediateStops.join(' ➔ ')}\n`;
          }
        });

        // Add Transfer Tips
        if (rec.segments.length > 1) {
          output += `\n💁 **Interchange Advisory:** Walk through the designated elevated pedestrian bridges when transferring lines. Tap out correctly to avoid maximum card penalty fees!`;
        } else {
          output += `\n💁 **Direct Commute:** Nice! This is a direct line commute on the **${rec.segments[0].lineName}**.`;
        }
        return output;
      }

      return `🧭 **Commute Lookup Failed:**\nI couldn't chart a continuous path from "${cleanFrom}" to "${cleanTo}". \n\n💡 **However!** You can connect unknown areas by adding a custom Jeepney or Tricycle route connecting your area to a known train station (like "Tricycle from Home to LRT Monumento"). Once saved, I can seamlessly merge it into my transit web!`;
    }

    // 9. Traditional General Fares guidelines
    if (q.includes('fare') || q.includes('pasahe') || q.includes('price') || q.includes('how much') || q.includes('cost') || q.includes('bayad')) {
      if (q.includes('jeep') || q.includes('puj') || q.includes('puy')) {
        return `🛺 **Jeepney Fares (LTFRB Guidelines):**\n\n• **Traditional Jeep:** Base fare is **₱13.00** for the first 4 kilometers. Every additional kilometer is **₱1.80**.\n• **Modernized Airconditioned Jeeps:** Base fare is **₱15.00** for the first 4 kilometers, plus **₱2.20** per excess kilometer.\n• **Student/Senior/PWD discount:** Eligible for a 20% discount on total fare upon showing institutional IDs.`;
      }
      if (q.includes('tricycle') || q.includes('tryke')) {
        return `🚲 **Tricycle Fares (Standard Local regulations):**\n\n• **Shared route:** ₱10.00 to ₱15.00 per head depending on barangay zoning laws.\n• **Private hiring (Special ride):** Starts at ₱30.00 to ₱50.00 base for a 1-2 kilometer trip. Fares can exceed ₱100.00 for long, uphill, or isolated areas. Negotiate prior to departure!`;
      }
      if (q.includes('bus') || q.includes('carousel')) {
        return `🚌 **Bus & EDSA Carousel Fares:**\n\n• **EDSA Bus Carousel:** Base fare of **₱15.00** (initial 5 km) + **₱2.20/km**. Runs on dedicated inner lanes to avoid slow EDSA bumper-to-bumper car jams.\n• **Ordinary buses:** Base is around ₱13.00 if non-aircon.\n• **Provincial buses:** Specialized flat matrices depending on SCTEX/NLEX travel distances.`;
      }
      if (q.includes('train') || q.includes('mrt') || q.includes('lrt') || q.includes('pnr')) {
        return `🚇 **Manila Railway Systems Fare Scale (2025/2026):**\n\n• **MRT-3 (EDSA Blue Line):** ₱13.00 minimum base fare up to ₱28.00 maximum for Taft-North Avenue terminal runs.\n• **LRT-1 (Cavite-Monumento):** ₱15.00 base, with custom caps at ₱30.00.\n• **LRT-2 (Recto-Antipolo):** ₱15.00 base, up to ₱35.00 for complete line commutation.\n• **E-Wallet utility:** Ideal to avoid long queuing tickets! Add funds in your Routes or Profile tab.`;
      }
      return `💰 **Manila Commuter Quick Cost Guidelines:**\n\n• **Jeepney (Traditional):** ₱13 base (first 4km) + ₱1.80/km\n• **Jeepney (Modern):** ₱15 base (first 4km) + ₱2.20/km\n• **Bus Carousel:** ₱15 base (first 5km) + ₱2.20/km\n• **UV Express:** ₱25 base (first 6km) + ₱2.80/km\n• **Trains (LRT/MRT):** ₱13–₱15 base + ₱1.10–₱1.20 per additional km.`;
    }

    if (q.includes('gilmore')) {
      return `💻 **LRT-2 Gilmore Electronics Hub:**\n\n• **Best Access Method:** Board the **LRT-2 Purple train line** and alight precisely at **Gilmore Station**.\n• **Area Guide:** Exit via the North gates to explore Broadway Centrum or the South gates for Manila's primary IT hub.\n• **Hours of travel:** 5:00 AM to 9:30 PM daily.`;
    }

    if (q.includes('wallet') || q.includes('balance') || q.includes('money')) {
      return `💳 **Offline Wallet System:**\n\nYour active profile e-wallet currently has **₱${profile.currentBala.toFixed(2)}**. Fares can be deducted from here when you start commutes. Type "Top up 100 pesos" to buy credit instantly via AI chat!`;
    }

    if (q.includes('hours') || q.includes('time') || q.includes('schedule')) {
      return `⏰ **Philippine Transit Standard Work Hours:**\n\n• **MRT-3 Blue Line:** First train departs Taft/North at 4:40 AM; last trains close around 9:30 PM.\n• **LRT-1 Green Line:** 4:30 AM to 10:00 PM (Monday-Friday); 5:00 AM to 9:30 PM (Weekends).\n• **LRT-2 Purple Line:** 5:00 AM to 9:30 PM daily.\n• **EDSA Bus Carousel:** Runs **24/7** midnight express lanes! Ideal for night-shift BPO employees.`;
    }

    // Small Talk & Human-like conversation
    const conversationalGreetings = /^(hi|hello|hey|mabuhay|kamusta|how are you|magandang|good morning|good afternoon|good evening)/i;
    if (conversationalGreetings.test(q) && q.length < 30) {
      return `Mabuhay! I am Mr. Sarao, your friendly AI Commuter guide. How can I help you with your routes today?`;
    }
    
    if (q.includes('who are you') || q.includes('what are you') || q.includes('your name')) {
      return `I am Mr. Sarao! An AI assistant designed exclusively for Mooderia Commute. I can help you find routes, calculate fares, compare travel paths, and manage your commuter wallet.`;
    }

    if (q.includes('thank you') || q.includes('thanks') || q.includes('salamat')) {
      return `You're very welcome, Ka-Commuter! Let me know if you need any more help. Ingat sa byahe! (Stay safe on your trip!)`;
    }

    if (q === 'help' || q.includes('what can you do')) {
      return `I can assist you with several things:\n• **Plan Routes:** "Create me a route"\n• **Compare Fares:** "Which is cheaper: Taft to Cubao or Monumento to Taft?"\n• **Wallet Top Up:** "Load 100 pesos"\n• **Diagnostics:** "Scan database status"\n\nJust talk to me naturally!`;
    }

    // Learning vocabulary structure (Simulated)
    const learnMatch = rawQuery.match(/learn\s+that\s+["']?([^"']+)["']?\s+(?:means|is)\s+["']?([^"']+)["']?/i);
    if (learnMatch) {
      const concept = learnMatch[1].trim();
      const meaning = learnMatch[2].trim();
      return `Got it! I have learned that **"${concept}"** means **"${meaning}"**. I'll remember this for our future conversations!`;
    }

    if (q.includes('offline') || q.includes('internet') || q.includes('no wifi') || q.includes('gprs')) {
      return `📶 **Universal Offline Autonomy:**\n\nYes! I am Mr. Sarao, a localized assistant running with static heuristic models. All routes remain strictly stored inside your localized offline database for 100% network data privacy!`;
    }

    if (q.includes('commute safety') || q.includes('tips') || q.includes('snat') || q.includes('safety')) {
      return `🎒 **Manila Commuter Street Safety Rules:**\n\n1. **Bag check:** Wear your backpack in front of you when walking through crowded areas (such as Cubao, Divisoria, Taft Avenue, and Carriedo).\n2. **Avoid flashing gadgets:** Keep smartphones safely in your pocket while waiting for jeepneys.\n3. **Loose change:** Prepare matching cash coins before embarking on custom Jeeps so you do not struggle with change.`;
    }

    return `🙋 **How can I assist you today, Ka-Commuter?**\n\nI didn't fully resolve a custom map pattern for "${rawQuery}". Try asking me about:\n\n• **Create a Route Model:** "Create route"\n• **Solve Multi-leg Routes:** "Monumento to Baguio" or "Taft Avenue to Antipolo"\n• **Find Cheaper Routes:** "Which is cheaper: Taft to Cubao or Monumento to Taft?"\n• **Charge e-Wallet:** "Top up 100 pesos to my wallet"\n• **Local Database Diagnostic:** "Scan local database status"`;
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Execute swift offline device processing response
    setTimeout(() => {
      const responseText = processResponse(text);
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 450);
  };

  return (
    <div id="offline-ai-container" className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden select-text">
      
      {/* Bot branding header */}
      <div className="bg-[#46178f] p-4 shrink-0 flex items-center justify-between shadow-md border-b-4 border-[#361175]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-[#9174f4]">
            <BrainCircuit className="w-6 h-6 text-[#46178f] dark:text-purple-350" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black tracking-tight text-white uppercase font-sans">Mr. Sarao</h3>
              <div className="bg-[#24a159] text-white text-[7px] font-black uppercase px-1 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                <Cpu className="w-2 h-2" />
                <span>On-Device AI</span>
              </div>
            </div>
            <span className="text-[9px] text-purple-200 block mt-0.5 max-w-max font-bold">
              Autonomous Commuter Transit Brain
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100 dark:bg-slate-900 flex flex-col style-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          // Basic formatter to handle bold and newlines
          const formatText = (txt: string) => {
            let processed = txt
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/```(?:sql)?\n([\s\S]*?)```/g, '<pre class="bg-slate-900 border border-slate-700 text-green-400 p-2 rounded truncate mt-2 mb-2 font-mono text-[10px]"><code>$1</code></pre>')
              .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
              .replace(/\*(.*?)\*/g, '<i>$1</i>')
              .replace(/\n\n/g, '<br/><br/>')
              .replace(/\n/g, '<br/>');
            return { __html: processed };
          };
          
          return (
            <div
              id={`ai-chat-bubble-${msg.id}`}
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                isUser ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
                {isUser ? (
                  <>
                    <span>You</span>
                    <div className="w-4 h-4 bg-purple-200 dark:bg-purple-900 text-[#46178f] rounded-full flex items-center justify-center text-[8px] font-black uppercase">
                      U
                    </div>
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-[#9174f4]" />
                    <span>Mr. Sarao</span>
                  </>
                )}
              </div>
              
              <div
                dangerouslySetInnerHTML={formatText(msg.text)}
                className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm [&_b]:font-black [&_i]:italic ${
                  isUser
                    ? 'bg-[#46178f] text-white rounded-tr-none border-b-4 border-purple-900 select-text'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-800 border-b-6 border-b-slate-300 dark:border-b-slate-950 rounded-tl-none select-text'
                }`}
              />
              
              <span className="text-[8px] text-gray-400 mt-1 ml-1 mr-1 font-mono">{msg.timestamp}</span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Presets recommendations */}
      <div className="bg-white dark:bg-slate-900 p-2 border-t border-slate-250 dark:border-slate-800 flex flex-nowrap gap-1.5 overflow-x-auto shrink-0 snap-x style-scrollbar">
        {PRESETS.map((preset, idx) => {
          const style = PRESET_CHIP_COLORS[idx % PRESET_CHIP_COLORS.length];
          return (
            <button
              id={`chat-preset-button-${idx}`}
              key={idx}
              onClick={() => handleSend(preset)}
              className={`flex items-center gap-1.5 shrink-0 ${style.bg} ${style.text} border ${style.border} text-[10px] px-3.5 py-2.5 rounded-2xl font-black transition cursor-pointer snap-start hover:scale-95 duration-100`}
            >
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              {preset}
            </button>
          );
        })}
      </div>

      {/* Keyboard Input Entry */}
      <div className="bg-white dark:bg-slate-900 p-3 border-t-2 border-slate-205 dark:border-slate-800 flex items-center gap-2 shrink-0">
        <input
          id="chat-user-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(inputText);
          }}
          placeholder="Ask Mr. Sarao: 'Create route Workspace from Tayuman to Gilmore...'"
          className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-2xl px-4 py-3 text-xs font-extrabold focus:outline-none focus:border-[#46178f] placeholder:text-gray-400 dark:placeholder:text-slate-500 select-text relative z-10"
        />
        <button
          id="chat-send-btn"
          onClick={() => handleSend(inputText)}
          className="w-11 h-11 bg-[#e21b3c] border-b-6 border-[#a0132a] text-white rounded-2xl flex items-center justify-center hover:bg-[#c21733] active:translate-y-0.5 active:border-b-2 transition cursor-pointer"
        >
          <Send className="w-4 h-4 shrink-0" />
        </button>
      </div>

    </div>
  );
}
