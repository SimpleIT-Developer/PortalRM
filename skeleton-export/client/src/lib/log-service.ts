export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success';
  title: string;
  details?: string;
  request?: string;
  response?: string;
}

const STORAGE_KEY = 'portalrm_debug_logs';

export const LogService = {
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const logs = LogService.getLogs();
    const newLog: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    // Keep only last 100 logs
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  },

  getLogs: (): LogEntry[] => {
    try {
      const logs = localStorage.getItem(STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      console.error('Failed to parse logs', e);
      return [];
    }
  },

  clearLogs: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
