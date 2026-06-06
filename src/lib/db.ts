/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stop } from '../types';
import { TRANSIT_LINES, ALL_UNIQUE_STOPS } from '../data/transitDatabase';

export interface SavedRoute {
  id: string;
  name: string;
  type: string; // 'Jeepney Route' | 'Tricycle Route' | 'UV Express' | 'Bus routes' | 'LRT Routes' | 'MRT Routes'
  fromStop: string;
  toStop: string;
  expenseValue: number; // custom fare/expense in PHP
  routeNumber?: string;
  fromCustom?: boolean;
  toCustom?: boolean;
  notes?: string;
  createdAt: number;
}

export interface UserProfile {
  username: string;
  pinCode: string; // 6-digit pin
  pinEnabled: boolean;
  theme: 'light' | 'dark';
  currentBala: number; // Commuter e-wallet simulated balance
  tripsTaken: number;
  totalSpent: number;
  profileCreated: boolean;
  co2SavedKg: number;
  lastName?: string;
  firstName?: string;
  middleInitial?: string;
  civilStatus?: string;
  gender?: string;
  province?: string;
  profilePic?: string; // base64 string
  todayTrips?: number;
  todayCost?: number;
}

const DEFAULT_PROFILE: UserProfile = {
  username: '',
  pinCode: '',
  pinEnabled: false,
  theme: 'light',
  currentBala: 0, // starting balance PHP 0 as requested
  tripsTaken: 0, // blank statistics
  totalSpent: 0,
  profileCreated: false,
  co2SavedKg: 0,
  lastName: '',
  firstName: '',
  middleInitial: '',
  civilStatus: '',
  gender: '',
  province: '',
  profilePic: '',
  todayTrips: 0,
  todayCost: 0,
};

const DEFAULT_SAVED_ROUTES: SavedRoute[] = [];

class InMemorySQLiteDatabase {
  private savedRoutes: SavedRoute[] = [];
  private profile: UserProfile = { ...DEFAULT_PROFILE };
  private queryHistory: { sql: string; timestamp: number; success: boolean; rowsCount: number }[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const storedProfile = localStorage.getItem('mooderia_profile');
      if (storedProfile) {
        this.profile = JSON.parse(storedProfile);
      } else {
        this.profile = { ...DEFAULT_PROFILE };
      }

      const storedRoutes = localStorage.getItem('mooderia_saved_routes');
      if (storedRoutes) {
        this.savedRoutes = JSON.parse(storedRoutes);
      } else {
        this.savedRoutes = [...DEFAULT_SAVED_ROUTES];
        this.saveRoutesToStorage();
      }
    } catch (e) {
      console.error('[SQLite DB] Failed to parse local storage, falling back to in-memory only', e);
      this.profile = { ...DEFAULT_PROFILE };
      this.savedRoutes = [...DEFAULT_SAVED_ROUTES];
    }
  }

  private saveProfileToStorage() {
    localStorage.setItem('mooderia_profile', JSON.stringify(this.profile));
  }

  private saveRoutesToStorage() {
    localStorage.setItem('mooderia_saved_routes', JSON.stringify(this.savedRoutes));
  }

  // --- Profile Operations ---
  public getProfile(): UserProfile {
    return this.profile;
  }

  public updateProfile(updated: Partial<UserProfile>) {
    this.profile = { ...this.profile, ...updated };
    this.saveProfileToStorage();
    this.logQuery(`UPDATE user_profile SET ${Object.keys(updated).map(k => `${k} = ?`).join(', ')}`);
  }

  public deleteAccount() {
    this.profile = { ...DEFAULT_PROFILE };
    this.savedRoutes = [...DEFAULT_SAVED_ROUTES];
    localStorage.removeItem('mooderia_profile');
    localStorage.removeItem('mooderia_saved_routes');
    this.saveProfileToStorage();
    this.saveRoutesToStorage();
    this.logQuery('DELETE FROM user_profile; DELETE FROM saved_routes;');
  }

  // --- Saved Routes Operations ---
  public getSavedRoutes(): SavedRoute[] {
    return this.savedRoutes;
  }

  public addSavedRoute(route: Omit<SavedRoute, 'id' | 'createdAt'>): SavedRoute {
    const newRoute: SavedRoute = {
      ...route,
      id: `route-${Date.now()}`,
      createdAt: Date.now()
    };
    this.savedRoutes.push(newRoute);
    this.saveRoutesToStorage();
    this.logQuery(`INSERT INTO user_routes (name, type, from_stop, to_stop, expense) VALUES ('${newRoute.name}', '${newRoute.type}', '${newRoute.fromStop}', '${newRoute.toStop}', ${newRoute.expenseValue})`);
    return newRoute;
  }

  public updateSavedRoute(id: string, updated: Partial<SavedRoute>) {
    const idx = this.savedRoutes.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.savedRoutes[idx] = { ...this.savedRoutes[idx], ...updated };
      this.saveRoutesToStorage();
      this.logQuery(`UPDATE user_routes SET ${Object.keys(updated).map(k => `${k} = ?`).join(', ')} WHERE id = '${id}'`);
    }
  }

  public deleteSavedRoute(id: string) {
    this.savedRoutes = this.savedRoutes.filter(r => r.id !== id);
    this.saveRoutesToStorage();
    this.logQuery(`DELETE FROM user_routes WHERE id = '${id}'`);
  }

  // --- Pure Local DB emulation for the console logging ---
  private logQuery(sql: string, success = true, count = 1) {
    this.queryHistory.push({
      sql,
      timestamp: Date.now(),
      success,
      rowsCount: count
    });
    console.log(`[Offline Database] Executed: "${sql}"`);
  }

  public getQueryHistory() {
    return this.queryHistory;
  }

  /**
   * Evaluates SQL queries for the Local AI Console or visual logs logs.
   */
  public executeSql(sql: string): any[] {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');
    const lowerSql = cleanSql.toLowerCase();
    
    this.logQuery(cleanSql, true, 1);

    if (lowerSql.startsWith('select')) {
      if (lowerSql.includes('from saved_routes') || lowerSql.includes('from user_routes')) {
        return this.savedRoutes;
      }
      if (lowerSql.includes('from user_profile') || lowerSql.includes('from profile')) {
        return [this.profile];
      }
    }
    return [{ status: "ok", query_executed: cleanSql }];
  }
}

// Single database service instance
export const db = new InMemorySQLiteDatabase();
