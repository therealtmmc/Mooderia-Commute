/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

export interface TransitLine {
  id: string;
  name: string;
  type: 'Train' | 'Jeep' | 'UV Express' | 'Bus' | 'Tricycle';
  color: string;
  stops: Stop[];
  baseFare: number;
  perKmFare: number;
  minDistance: number; // base distance for base fare, e.g. 4km for jeep
}

export interface RouteSegment {
  lineId: string;
  lineName: string;
  type: 'Train' | 'Jeep' | 'UV Express' | 'Bus' | 'Tricycle';
  color: string;
  fromStop: Stop;
  toStop: Stop;
  stopsCount: number;
  distanceKm: number;
  fare: number;
  intermediateStops: string[];
}

export interface TravelRecommendation {
  segments: RouteSegment[];
  totalFare: number;
  totalDistanceKm: number;
  totalDurationMin: number;
}

export interface LocationBreadcrumb {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number; // m/s
  accuracy?: number;
}

export interface ActiveStats {
  isTracking: boolean;
  isSimulated: boolean;
  distanceTraveledKm: number;
  elapsedTimeSec: number;
  currentSpeedKph: number;
  passedStops: string[];
  remainingStops: string[];
  currentLocation: { lat: number; lng: number } | null;
  breadcrumbs: LocationBreadcrumb[];
}

export interface ArchitectureDoc {
  title: string;
  language: string;
  filename: string;
  code: string;
  description: string;
}
