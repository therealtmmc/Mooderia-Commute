import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function MapsView() {
  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center font-sans bg-slate-50 dark:bg-slate-950">
        <div className="max-w-sm space-y-4">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Google Maps API Key Required</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener" className="text-[#46178f] dark:text-purple-300 font-bold">Get an API Key</a></p>
          <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Step 2:</strong> Add your key as a secret in AI Studio (Secrets → GOOGLE_MAPS_PLATFORM_KEY).</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">The app rebuilds automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <Map
        defaultCenter={{lat: 14.5995, lng: 120.9842}}
        defaultZoom={12}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{width: '100%', height: '100%'}}
      >
        <AdvancedMarker position={{lat: 14.5995, lng: 120.9842}}>
          <Pin background="#4285F4" glyphColor="#fff" />
        </AdvancedMarker>
      </Map>
    </APIProvider>
  );
}
