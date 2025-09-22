import { WorkoutLog } from '@/data/exercises';
import { apiLogger } from '@/lib/apiLogger';

declare global {
  interface Window {
    gapi: any;
  }
}

export interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  sheetName: string;
  accessToken?: string;
  clientId?: string;
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig;
  private isGapiLoaded = false;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
    this.loadGoogleAPI();
  }

  private async loadGoogleAPI() {
    if (this.isGapiLoaded || window.gapi) return;
    
    return new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          this.isGapiLoaded = true;
          resolve();
        });
      };
      document.head.appendChild(script);
    });
  }

  async initializeGoogleAPI() {
    await this.loadGoogleAPI();
    
    await window.gapi.client.init({
      apiKey: this.config.apiKey,
      clientId: this.config.clientId,
      discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
      scope: 'https://www.googleapis.com/auth/spreadsheets'
    });
  }

  async signIn(): Promise<boolean> {
    try {
      await this.initializeGoogleAPI();
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      if (authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        const authResponse = user.getAuthResponse();
        this.config.accessToken = authResponse.access_token;
        
        // Store token in localStorage
        localStorage.setItem('google_access_token', authResponse.access_token);
        localStorage.setItem('google_token_expires', authResponse.expires_at.toString());
        
        apiLogger.log({
          status: 'success',
          source: 'GoogleOAuth',
          action: 'signIn',
          message: 'Already signed in to Google'
        });
        
        return true;
      }
      
      const user = await authInstance.signIn();
      const authResponse = user.getAuthResponse();
      this.config.accessToken = authResponse.access_token;
      
      // Store token in localStorage
      localStorage.setItem('google_access_token', authResponse.access_token);
      localStorage.setItem('google_token_expires', authResponse.expires_at.toString());
      
      apiLogger.log({
        status: 'success',
        source: 'GoogleOAuth',
        action: 'signIn',
        message: 'Successfully signed in to Google'
      });
      
      return true;
    } catch (error: any) {
      apiLogger.log({
        status: 'error',
        source: 'GoogleOAuth',
        action: 'signIn',
        message: error?.message || 'Failed to sign in to Google',
        meta: { error }
      });
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      
      // Clear stored tokens
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_token_expires');
      this.config.accessToken = undefined;
      
      apiLogger.log({
        status: 'success',
        source: 'GoogleOAuth',
        action: 'signOut',
        message: 'Successfully signed out from Google'
      });
    } catch (error: any) {
      apiLogger.log({
        status: 'error',
        source: 'GoogleOAuth',
        action: 'signOut',
        message: error?.message || 'Failed to sign out from Google',
        meta: { error }
      });
    }
  }

  isSignedIn(): boolean {
    if (!this.isGapiLoaded || !window.gapi.auth2) return false;
    
    const authInstance = window.gapi.auth2.getAuthInstance();
    return authInstance && authInstance.isSignedIn.get();
  }

  private isTokenValid(): boolean {
    const token = localStorage.getItem('google_access_token');
    const expiresAt = localStorage.getItem('google_token_expires');
    
    if (!token || !expiresAt) return false;
    
    const now = Date.now();
    const expires = parseInt(expiresAt);
    
    return now < expires;
  }

  private getBaseUrl() {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}`;
  }

  async initializeSheet() {
    try {
      await this.initializeGoogleAPI();
      
      // Check if sheet exists, if not create it
      const sheetUrl = `${this.getBaseUrl()}?key=${this.config.apiKey}`;
      const response = await fetch(sheetUrl);
      
      if (!response.ok) {
        throw new Error('Failed to access spreadsheet. Please check your API key and spreadsheet ID.');
      }

      const data = await response.json();
      const sheetExists = data.sheets?.some((sheet: any) => 
        sheet.properties.title === this.config.sheetName
      );

      if (!sheetExists) {
        await this.createWorkoutSheet();
      }

      // Initialize headers if needed
      await this.ensureHeaders();
    } catch (error) {
      console.error('Error initializing sheet:', error);
      throw error;
    }
  }

  private async createWorkoutSheet() {
    if (!this.config.accessToken) {
      throw new Error('OAuth authentication required to create sheets');
    }

    try {
      const response = await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: this.config.sheetName
              }
            }
          }]
        }
      });

      apiLogger.log({
        status: 'success',
        source: 'GoogleSheets',
        action: 'createSheet',
        message: `Created sheet: ${this.config.sheetName}`
      });
    } catch (error: any) {
      apiLogger.log({
        status: 'error',
        source: 'GoogleSheets',
        action: 'createSheet',
        message: error?.message || 'Failed to create sheet',
        meta: { error }
      });
      throw error;
    }
  }

  private async ensureHeaders() {
    try {
      const headers = [
        'Date', 'Exercise Name', 'Muscle Group', 'Set Number', 
        'Reps', 'Weight (kg)', 'Difficulty Level', 'Notes'
      ];

      const range = `${this.config.sheetName}!A1:H1`;
      const url = `${this.getBaseUrl()}/values/${range}?key=${this.config.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.values || data.values.length === 0) {
        if (this.config.accessToken) {
          await this.addHeaders(headers);
        } else {
          console.log('Please add these headers to row 1:', headers);
        }
      }
    } catch (error) {
      console.error('Error checking headers:', error);
    }
  }

  private async addHeaders(headers: string[]) {
    try {
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.sheetName}!A1:H1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });

      apiLogger.log({
        status: 'success',
        source: 'GoogleSheets',
        action: 'addHeaders',
        message: 'Added headers to spreadsheet'
      });
    } catch (error: any) {
      apiLogger.log({
        status: 'error',
        source: 'GoogleSheets',
        action: 'addHeaders',
        message: error?.message || 'Failed to add headers',
        meta: { error }
      });
    }
  }

  async logWorkout(workoutLog: WorkoutLog): Promise<boolean> {
    try {
      apiLogger.log({
        status: 'info',
        source: 'GoogleSheets',
        action: 'logWorkout',
        message: 'Preparing to log workout',
        meta: { exerciseId: workoutLog.exerciseId, sets: workoutLog.sets.length }
      });
      
      const rows = workoutLog.sets.map((set, index) => [
        workoutLog.date,
        workoutLog.exerciseName,
        workoutLog.muscleGroup,
        (index + 1).toString(),
        set.reps.toString(),
        set.weight.toString(),
        workoutLog.difficulty || '', // Difficulty level
        '' // Notes
      ]);

      if (this.config.accessToken && this.isTokenValid()) {
        // Write to Google Sheets using OAuth
        await window.gapi.client.sheets.spreadsheets.values.append({
          spreadsheetId: this.config.spreadsheetId,
          range: `${this.config.sheetName}!A:H`,
          valueInputOption: 'RAW',
          resource: {
            values: rows
          }
        });

        apiLogger.log({
          status: 'success',
          source: 'GoogleSheets',
          action: 'logWorkout',
          message: `Workout logged to Google Sheets: ${workoutLog.exerciseName}`,
          meta: { sets: rows.length }
        });
      } else {
        // Fallback to localStorage
        this.storeWorkoutLocally(workoutLog);
        apiLogger.log({
          status: 'info',
          source: 'LocalStorage',
          action: 'logWorkout',
          message: 'Stored locally (not signed in to Google Sheets)'
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('Error logging workout:', error);
      apiLogger.log({
        status: 'error',
        source: 'GoogleSheets',
        action: 'logWorkout',
        message: error?.message || 'Unknown error while logging workout',
        meta: { error }
      });
      // Fallback to local storage
      this.storeWorkoutLocally(workoutLog);
      return false;
    }
  }

  private storeWorkoutLocally(workoutLog: WorkoutLog) {
    try {
      const existingLogs = localStorage.getItem('workout_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(workoutLog);
      localStorage.setItem('workout_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error storing workout locally:', error);
    }
  }

  async getWorkoutHistory(muscleGroup?: string): Promise<WorkoutLog[]> {
    try {
      if (this.config.accessToken && this.isTokenValid()) {
        // Try to read from Google Sheets using OAuth
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: this.config.spreadsheetId,
          range: `${this.config.sheetName}!A:H`
        });

        if (response.result.values && response.result.values.length > 1) {
          const logs = this.parseSheetData(response.result.values);
          const result = muscleGroup ? logs.filter(log => log.muscleGroup === muscleGroup) : logs;

          apiLogger.log({
            status: 'success',
            source: 'GoogleSheets',
            action: 'getWorkoutHistory',
            message: `Loaded ${result.length} workouts from Google Sheets`,
            meta: { total: logs.length, filtered: result.length }
          });

          return result;
        }
      } else {
        // Try to read from Google Sheets with API key (read-only)
        const range = `${this.config.sheetName}!A:H`;
        const url = `${this.getBaseUrl()}/values/${range}?key=${this.config.apiKey}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.values && data.values.length > 1) {
            const logs = this.parseSheetData(data.values);
            const result = muscleGroup ? logs.filter(log => log.muscleGroup === muscleGroup) : logs;

            apiLogger.log({
              status: 'success',
              source: 'GoogleSheets',
              action: 'getWorkoutHistory',
              message: `Loaded ${result.length} workouts from Google Sheets (API key)`,
              meta: { total: logs.length, filtered: result.length }
            });

            return result;
          }
        }
      }
    } catch (error: any) {
      apiLogger.log({
        status: 'error',
        source: 'GoogleSheets',
        action: 'getWorkoutHistory',
        message: error?.message || 'Failed to read from Google Sheets',
        meta: { error }
      });
    }

    // Fallback to localStorage
    return this.getLocalWorkoutHistory(muscleGroup);
  }

  private parseSheetData(values: any[][]): WorkoutLog[] {
    const logs: WorkoutLog[] = [];
    const headers = values[0];
    
    // Group rows by date and exercise
    const groupedData = new Map<string, any>();
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const date = row[0];
      const exerciseName = row[1];
      const muscleGroup = row[2];
      const setNumber = parseInt(row[3]) || 1;
      const reps = parseInt(row[4]) || 0;
      const weight = parseFloat(row[5]) || 0;
      
      const key = `${date}-${exerciseName}`;
      
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          exerciseId: `${muscleGroup}-${exerciseName}`.toLowerCase().replace(/\s+/g, '-'),
          exerciseName,
          muscleGroup,
          date,
          sets: []
        });
      }
      
      groupedData.get(key).sets.push({ reps, weight });
    }
    
    return Array.from(groupedData.values());
  }

  private getLocalWorkoutHistory(muscleGroup?: string): WorkoutLog[] {
    try {
      const existingLogs = localStorage.getItem('workout_logs');
      const logs: WorkoutLog[] = existingLogs ? JSON.parse(existingLogs) : [];
      const result = muscleGroup ? logs.filter(log => log.muscleGroup === muscleGroup) : logs;

      apiLogger.log({
        status: 'success',
        source: 'LocalStorage',
        action: 'getWorkoutHistory',
        message: `Loaded ${result.length} workout logs from localStorage${muscleGroup ? ' (filtered)' : ''}.`,
        meta: { total: logs.length, filtered: result.length, muscleGroup: muscleGroup || 'all' }
      });
      
      return result;
    } catch (error: any) {
      console.error('Error reading local workout history:', error);
      apiLogger.log({
        status: 'error',
        source: 'LocalStorage',
        action: 'getWorkoutHistory',
        message: error?.message || 'Failed to read workout logs from localStorage',
        meta: { error }
      });
      return [];
    }
  }

  async getWorkoutHistoryOld(muscleGroup?: string): Promise<WorkoutLog[]> {
    try {
      // Try to read from Google Sheets first
      const range = `${this.config.sheetName}!A:H`;
      const url = `${this.getBaseUrl()}/values/${range}?key=${this.config.apiKey}`;

      apiLogger.log({
        status: 'info',
        source: 'GoogleSheets',
        action: 'getWorkoutHistory',
        message: 'Fetching workout history from Google Sheets',
        meta: { url }
      });
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        apiLogger.log({
          status: 'success',
          source: 'GoogleSheets',
          action: 'getWorkoutHistory',
          message: 'Fetched data from Google Sheets (parsing not implemented, using localStorage for now).',
          meta: { rows: data.values?.length ?? 0 }
        });
        // Parse Google Sheets data (implementation depends on sheet structure)
        // For now, fall back to localStorage
      } else {
        apiLogger.log({
          status: 'error',
          source: 'GoogleSheets',
          action: 'getWorkoutHistory',
          message: `Failed to fetch from Google Sheets: ${response.status} ${response.statusText}`,
          meta: { status: response.status }
        });
      }
    } catch (error: any) {
      console.error('Error reading from Google Sheets:', error);
      apiLogger.log({
        status: 'error',
        source: 'GoogleSheets',
        action: 'getWorkoutHistory',
        message: error?.message || 'Unknown error while reading from Google Sheets',
        meta: { error }
      });
    }

    return this.getLocalWorkoutHistory(muscleGroup);
  }

  async getProgressData(exerciseId: string, timeRange: 'week' | 'month' | 'quarter') {
    const logs = await this.getWorkoutHistory();
    const exerciseLogs = logs.filter(log => log.exerciseId === exerciseId);
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
    }

    return exerciseLogs
      .filter(log => new Date(log.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

// Utility functions for Google Sheets setup
export const validateGoogleSheetsConfig = (config: Partial<GoogleSheetsConfig>): string[] => {
  const errors: string[] = [];
  
  if (!config.clientId && !config.apiKey) {
    errors.push('Either Google OAuth Client ID or API key is required');
  }
  
  if (!config.spreadsheetId) {
    errors.push('Spreadsheet ID is required');
  }
  
  if (!config.sheetName) {
    errors.push('Sheet name is required');
  }

  return errors;
};

export const extractSpreadsheetId = (url: string): string | null => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};