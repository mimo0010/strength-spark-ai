export type ApiEventStatus = 'success' | 'error' | 'info';

export interface ApiEvent {
  id: string;
  timestamp: number; // epoch ms
  status: ApiEventStatus;
  source: string; // e.g., GoogleSheets, LocalStorage
  action: string; // e.g., getWorkoutHistory, logWorkout
  message: string;
  meta?: Record<string, any>;
}

const STORAGE_KEY = 'api_events';
const MAX_EVENTS = 100;

let events: ApiEvent[] = [];

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  events = saved ? JSON.parse(saved) : [];
} catch {
  events = [];
}

const listeners = new Set<(evts: ApiEvent[]) => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch (e) {
    // ignore storage errors
  }
}

function emit() {
  const snapshot = [...events];
  listeners.forEach((cb) => cb(snapshot));
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const apiLogger = {
  log(params: Omit<ApiEvent, 'id' | 'timestamp'>) {
    const evt: ApiEvent = { id: makeId(), timestamp: Date.now(), ...params };
    events.push(evt);
    if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
    persist();
    emit();
    return evt;
  },
  getEvents() {
    return [...events];
  },
  clear() {
    events = [];
    persist();
    emit();
  },
  subscribe(cb: (evts: ApiEvent[]) => void) {
    listeners.add(cb);
    const unsubscribe = () => { listeners.delete(cb); };
    return unsubscribe;
  },
};
