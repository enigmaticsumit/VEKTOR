/**
 * Utility functions for storing and retrieving recent analyses in localStorage.
 */

const STORAGE_KEY = 'vektor_recent_analyses_v1';
const MAX_HISTORY_ITEMS = 25;

export function getStoredAnalyses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read analyses from localStorage:', err);
    return [];
  }
}

export function saveAnalysisToHistory(response) {
  if (!response || !response.location) return null;

  try {
    const existing = getStoredAnalyses();
    const id = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const imageAnalysis = response.intelligence?.image_analysis;
    const weather = response.intelligence?.weather?.weather;
    const mission = response.logistics?.mission;

    const summaryItem = {
      id,
      timestamp: new Date().toISOString(),
      location: response.location,
      disasterType: imageAnalysis?.disaster_type || (response.logistics?.mission?.disaster_type) || 'General Assessment',
      severity: imageAnalysis?.severity || 'Normal',
      confidence: imageAnalysis?.confidence ?? null,
      disasterDetected: !!imageAnalysis?.disaster_detected,
      temperature: weather?.temperature_2m ?? null,
      weatherCondition: weather?.description || null,
      hasMission: !!mission,
      hasRoute: !!(mission?.route?.geometry && mission.route.geometry.length > 0),
      rawResponse: response,
    };

    // Filter out duplicates with identical location within last 2 minutes if needed, or keep latest at top
    const updated = [summaryItem, ...existing.filter(item => item.id !== id)].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return summaryItem;
  } catch (err) {
    console.error('Failed to save analysis to localStorage:', err);
    return null;
  }
}

export function removeAnalysisFromHistory(id) {
  try {
    const existing = getStoredAnalyses();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to remove analysis from localStorage:', err);
    return [];
  }
}

export function clearAnalysisHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('Failed to clear analyses:', err);
    return false;
  }
}
