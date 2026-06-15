import { ChargingSession, ChargingStation, Feedback } from '../types';

const KEYS = {
  FAVORITES: 'charging_favorites',
  HISTORY: 'charging_history',
  CURRENT_SESSION: 'charging_current_session',
  FEEDBACKS: 'charging_feedbacks',
};

// ---- Favorites ----
export function getFavorites(): string[] {
  try {
    const data = localStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(stationId: string): string[] {
  const favs = getFavorites();
  const idx = favs.indexOf(stationId);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(stationId);
  }
  localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
  return favs;
}

export function isFavorite(stationId: string): boolean {
  return getFavorites().includes(stationId);
}

// ---- History ----
export function getHistory(): ChargingSession[] {
  try {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addHistory(session: ChargingSession): void {
  const history = getHistory();
  history.unshift(session);
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

// ---- Current Session ----
export function getCurrentSession(): ChargingSession | null {
  try {
    const data = localStorage.getItem(KEYS.CURRENT_SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveCurrentSession(session: ChargingSession | null): void {
  if (session) {
    localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(KEYS.CURRENT_SESSION);
  }
}

// ---- Stats helpers ----
export function getMonthlyStats(history: ChargingSession[]) {
  const now = new Date();
  const months: { label: string; cost: number; count: number; energy: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = `${month + 1}月`;

    const sessions = history.filter(s => {
      const sd = new Date(s.startTime);
      return sd.getFullYear() === year && sd.getMonth() === month;
    });

    months.push({
      label,
      cost: sessions.reduce((sum, s) => sum + s.cost, 0),
      count: sessions.length,
      energy: sessions.reduce((sum, s) => sum + s.energyUsed, 0),
    });
  }

  return months;
}

// ---- Feedbacks ----
export function getFeedbacks(): Feedback[] {
  try {
    const data = localStorage.getItem(KEYS.FEEDBACKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getFeedbacksByStation(stationId: string): Feedback[] {
  return getFeedbacks().filter(f => f.stationId === stationId);
}

export function getFeedbackBySession(sessionId: string): Feedback | undefined {
  return getFeedbacks().find(f => f.sessionId === sessionId);
}

export function addFeedback(feedback: Feedback): void {
  const feedbacks = getFeedbacks();
  feedbacks.unshift(feedback);
  localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify(feedbacks));
}

export function updateFeedback(id: string, updates: Partial<Feedback>): void {
  const feedbacks = getFeedbacks();
  const idx = feedbacks.findIndex(f => f.id === id);
  if (idx >= 0) {
    feedbacks[idx] = { ...feedbacks[idx], ...updates };
    localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify(feedbacks));
  }
}

export function deleteFeedback(id: string): void {
  const feedbacks = getFeedbacks().filter(f => f.id !== id);
  localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify(feedbacks));
}

export function getStationAverageRating(stationId: string): number {
  const stationFeedbacks = getFeedbacksByStation(stationId);
  if (stationFeedbacks.length === 0) return 0;
  const sum = stationFeedbacks.reduce((acc, f) => acc + f.rating, 0);
  return Math.round((sum / stationFeedbacks.length) * 10) / 10;
}
