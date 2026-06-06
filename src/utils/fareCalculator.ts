/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stop, TransitLine, RouteSegment, TravelRecommendation } from '../types';
import { TRANSIT_LINES } from '../data/transitDatabase';

// Standard Haversine distance formula
export function getHaversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's Radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate the fare based on the official distance matrix tables
export function computeFare(
  distanceKm: number,
  baseFare: number,
  perKmRate: number,
  minDistance: number
): number {
  if (distanceKm <= minDistance) {
    return baseFare;
  }
  const extraDistance = distanceKm - minDistance;
  // Fares in PH transit are rounded to nearest 0.25, 0.5 or 1.0 Peso; we'll round to the nearest Peso for clean minimalism
  return Math.round(baseFare + extraDistance * perKmRate);
}

// Build adjacency list for routing
interface AdjacencyNode {
  lineId: string;
  nextStop: Stop;
}

export function findRoute(origin: Stop, destination: Stop): TravelRecommendation | null {
  // 1. Check direct line first - yields the best experience
  for (const line of TRANSIT_LINES) {
    const originStopInLine = line.stops.find(s => s.name === origin.name);
    const destStopInLine = line.stops.find(s => s.name === destination.name);

    if (originStopInLine && destStopInLine) {
      const orderStart = originStopInLine.order;
      const orderEnd = destStopInLine.order;
      
      const isForward = orderStart < orderEnd;
      const sortedStopsInRange = line.stops
        .filter(s => isForward ? (s.order >= orderStart && s.order <= orderEnd) : (s.order >= orderEnd && s.order <= orderStart))
        .sort((a, b) => isForward ? a.order - b.order : b.order - a.order);

      // Verify the stops list is robust
      if (sortedStopsInRange.length >= 2) {
        // Calculate cumulative sequential haversine distances
        let totalDist = 0;
        for (let i = 0; i < sortedStopsInRange.length - 1; i++) {
          totalDist += getHaversineDistanceKm(
            sortedStopsInRange[i].lat,
            sortedStopsInRange[i].lng,
            sortedStopsInRange[i + 1].lat,
            sortedStopsInRange[i + 1].lng
          );
        }

        const fare = computeFare(totalDist, line.baseFare, line.perKmFare, line.minDistance);
        
        const segment: RouteSegment = {
          lineId: line.id,
          lineName: line.name,
          type: line.type,
          color: line.color,
          fromStop: originStopInLine,
          toStop: destStopInLine,
          stopsCount: sortedStopsInRange.length,
          distanceKm: parseFloat(totalDist.toFixed(2)),
          fare: parseFloat(fare.toFixed(2)),
          intermediateStops: sortedStopsInRange.map(s => s.name)
        };

        return {
          segments: [segment],
          totalFare: segment.fare,
          totalDistanceKm: segment.distanceKm,
          totalDurationMin: Math.ceil(segment.distanceKm * (line.type === 'Train' ? 1.5 : 3.0) + 2) // estimated commuting speed plus wait time
        };
      }
    }
  }

  // 2. Transfer-aware Multi-leg finding (BFS with transfers)
  // Let's look for transfer intersections (stops with same or very close coordinates)
  // We'll search for common transfer junctions:
  // - Cubao (connects LRT-2 Cubao and MRT-3 Cubao)
  // - EDSA / Taft (connects LRT-1 EDSA and MRT-3 Taft)
  // - Blumentritt (connects LRT-1 Blumentritt and PNR Blumentritt)
  // - Vito Cruz (connects LRT-1 Vito Cruz and PNR Vito Cruz)
  // - Buendia (connects LRT-1 Gil Puyat and PNR Buendia and MRT Buendia)

  // To build multi-leg transfer easily:
  // Find transit line of origin, transfer stop coordinates, then transit line of destination.
  const originLines = TRANSIT_LINES.filter(l => l.stops.some(s => s.name === origin.name));
  const destLines = TRANSIT_LINES.filter(l => l.stops.some(s => s.name === destination.name));

  for (const oLine of originLines) {
    for (const dLine of destLines) {
      if (oLine.id === dLine.id) continue;

      // Find an intersection stop
      // Intersection means stops that are close (< 1.5km) or share a name key (e.g. 'Cubao', 'EDSA')
      for (const oStop of oLine.stops) {
        for (const dStop of dLine.stops) {
          const isJunctionName = 
            (oStop.name.includes('Cubao') && dStop.name.includes('Cubao')) ||
            (oStop.name.includes('EDSA') && dStop.name.includes('EDSA')) ||
            (oStop.name.includes('Blumentritt') && dStop.name.includes('Blumentritt')) ||
            (oStop.name.includes('Vito Cruz') && dStop.name.includes('Vito Cruz')) ||
            (oStop.name.includes('Buendia') && dStop.name.includes('Buendia')) ||
            getHaversineDistanceKm(oStop.lat, oStop.lng, dStop.lat, dStop.lng) < 0.6; // 600m walking distance

          if (isJunctionName) {
            // Found transfer hub!
            // Leg 1: Origin to Junction
            const leg1 = findDirectLeg(oLine, origin, oStop);
            // Leg 2: Junction to Destination
            const leg2 = findDirectLeg(dLine, dStop, destination);

            if (leg1 && leg2) {
              const totalFare = leg1.fare + leg2.fare;
              const totalDistance = parseFloat((leg1.distanceKm + leg2.distanceKm).toFixed(2));
              const totalDuration = leg1.stopsCount * 2 + leg2.stopsCount * 2 + 8; // adds transfer penalty

              return {
                segments: [leg1, leg2],
                totalFare,
                totalDistanceKm: totalDistance,
                totalDurationMin: totalDuration
              };
            }
          }
        }
      }
    }
  }

  // Fallback: Default to a direct distance estimation (like UV express route custom pricing)
  const straightDist = getHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const estFare = computeFare(straightDist, 15.00, 2.00, 4.0);

  const mockStopFrom: Stop = { id: 'manual-start', name: origin.name, lat: origin.lat, lng: origin.lng, order: 1 };
  const mockStopTo: Stop = { id: 'manual-end', name: destination.name, lat: destination.lat, lng: destination.lng, order: 2 };

  return {
    segments: [{
      lineId: 'custom-jeep',
      lineName: 'UV Express / Multi-Leg Connected Commute',
      type: 'UV Express',
      color: '#00aaaa',
      fromStop: mockStopFrom,
      toStop: mockStopTo,
      stopsCount: 2,
      distanceKm: parseFloat(straightDist.toFixed(2)),
      fare: parseFloat(estFare.toFixed(2)),
      intermediateStops: [origin.name, 'Transit Node Connecting Pathway', destination.name]
    }],
    totalFare: estFare,
    totalDistanceKm: parseFloat(straightDist.toFixed(2)),
    totalDurationMin: Math.ceil(straightDist * 3.5 + 5)
  };
}

export function findDirectLeg(line: TransitLine, from: Stop, to: Stop): RouteSegment | null {
  const sStart = line.stops.find(s => s.name === from.name || s.id === from.id);
  const sEnd = line.stops.find(s => s.name === to.name || s.id === to.id);

  if (!sStart || !sEnd) return null;
  const oStart = sStart.order;
  const oEnd = sEnd.order;
  const isForward = oStart < oEnd;

  const sortedRange = line.stops
    .filter(s => isForward ? (s.order >= oStart && s.order <= oEnd) : (s.order >= oEnd && s.order <= oStart))
    .sort((a, b) => isForward ? a.order - b.order : b.order - a.order);

  if (sortedRange.length < 2) return null;

  let totalDist = 0;
  for (let i = 0; i < sortedRange.length - 1; i++) {
    totalDist += getHaversineDistanceKm(
      sortedRange[i].lat,
      sortedRange[i].lng,
      sortedRange[i + 1].lat,
      sortedRange[i + 1].lng
    );
  }

  const fare = computeFare(totalDist, line.baseFare, line.perKmFare, line.minDistance);

  return {
    lineId: line.id,
    lineName: line.name,
    type: line.type,
    color: line.color,
    fromStop: sStart,
    toStop: sEnd,
    stopsCount: sortedRange.length,
    distanceKm: parseFloat(totalDist.toFixed(2)),
    fare: parseFloat(fare.toFixed(2)),
    intermediateStops: sortedRange.map(s => s.name)
  };
}

// Generate coordinate trail between stops for offline map animation
export function generateIntermediatePoints(fromLat: number, fromLng: number, toLat: number, toLng: number, segments = 10): { lat: number, lng: number }[] {
  const points: { lat: number, lng: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const fraction = i / segments;
    // Linear interpolation for simple mock vector visualization
    const lat = fromLat + (toLat - fromLat) * fraction;
    const lng = fromLng + (toLng - fromLng) * fraction;
    points.push({ lat, lng });
  }
  return points;
}
