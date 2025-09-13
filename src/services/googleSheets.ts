import { WorkoutLog } from '@/data/exercises';
import { apiLogger } from '@/lib/apiLogger';

export interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  sheetName: string;
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  private getBaseUrl() {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}`;
  }

  async initializeSheet() {
    try {
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
    // Note: Creating new sheets requires write permissions
    // For this frontend-only implementation, users need to manually create the sheet
    console.log(`Please manually create a sheet named "${this.config.sheetName}" in your spreadsheet`);
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

      // If no headers exist, we'd need write access to add them
      if (!data.values || data.values.length === 0) {
        console.log('Please add these headers to row 1:', headers);
      }
    } catch (error) {
      console.error('Error checking headers:', error);
    }
  }

  async logWorkout(workoutLog: WorkoutLog): Promise<boolean> {
    try {
      // For this frontend implementation, we'll use the append API
      // This requires the spreadsheet to be publicly editable or use OAuth
      const range = `${this.config.sheetName}!A:H`;

      apiLogger.log({
        status: 'info',
        source: 'GoogleSheets',
        action: 'logWorkout',
        message: 'Preparing to log workout (frontend-only mode)',
        meta: { exerciseId: workoutLog.exerciseId, sets: workoutLog.sets.length }
      });
      
      const rows = workoutLog.sets.map((set, index) => [
        workoutLog.date,
        workoutLog.exerciseName,
        workoutLog.muscleGroup,
        (index + 1).toString(),
        set.reps.toString(),
        set.weight.toString(),
        '', // Difficulty level
        '' // Notes
      ]);

      // Since we're using frontend-only approach with API key only,
      // we can only read data, not write. Users would need OAuth for writing.
      console.log('Workout data prepared for logging:', rows);
      apiLogger.log({
        status: 'info',
        source: 'GoogleSheets',
        action: 'logWorkout',
        message: 'Write to Google Sheets skipped (API key only). Storing locally.'
      });
      
      // Store in localStorage as fallback
      this.storeWorkoutLocally(workoutLog);
      apiLogger.log({
        status: 'success',
        source: 'LocalStorage',
        action: 'logWorkout',
        message: 'Workout stored locally as fallback.'
      });
      
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
      apiLogger.log({
        status: 'success',
        source: 'LocalStorage',
        action: 'logWorkout',
        message: 'Workout stored locally after error.'
      });
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

    // Fallback to localStorage
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
  
  if (!config.apiKey) {
    errors.push('Google Sheets API key is required');
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