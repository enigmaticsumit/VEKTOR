/**
 * VEKTOR API Service Layer
 * Connects to Intelligence (:8001) and Logistics (:8002) backends.
 */

const DEFAULT_INTELLIGENCE_URL = 'http://localhost:8001';
const DEFAULT_LOGISTICS_URL = 'http://localhost:8002';

export const getApiUrls = () => {
  return {
    intelligence: import.meta.env.VITE_INTELLIGENCE_API_URL || DEFAULT_INTELLIGENCE_URL,
    logistics: import.meta.env.VITE_LOGISTICS_API_URL || DEFAULT_LOGISTICS_URL,
  };
};

/**
 * Check connectivity to both backend services
 */
export async function checkBackendHealth() {
  const { intelligence, logistics } = getApiUrls();
  const results = {
    intelligence: { online: false, url: intelligence, details: null },
    logistics: { online: false, url: logistics, details: null },
  };

  const check = async (url) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        return { online: true, details: data };
      }
      return { online: false, details: `HTTP ${res.status}` };
    } catch (err) {
      clearTimeout(timeout);
      return { online: false, details: err.message || 'Unreachable' };
    }
  };

  const [intelResult, logResult] = await Promise.all([
    check(intelligence),
    check(logistics),
  ]);

  results.intelligence = { ...results.intelligence, ...intelResult };
  results.logistics = { ...results.logistics, ...logResult };

  return results;
}

/**
 * Main disaster analysis action using the unified /full-response endpoint
 */
export async function runFullAnalysis({ location, file, signal }) {
  const { logistics } = getApiUrls();
  const endpoint = `${logistics}/full-response`;

  const formData = new FormData();
  formData.append('location', location || 'Jammu');

  if (file) {
    formData.append('file', file, file.name);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!response.ok) {
      let errorMessage = `Server error (HTTP ${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        }
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Analysis request was cancelled.');
    }
    
    // Enrich network / connection errors with helpful guidance
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      throw new Error(
        `Unable to connect to VEKTOR Logistics Brain at ${logistics}. Ensure the backend services are running on ports 8001 and 8002.`
      );
    }
    throw err;
  }
}

/**
 * Direct relief plan generator (calls POST /plan on Logistics API)
 */
export async function createReliefPlan({ location, disasterType, signal }) {
  const { logistics } = getApiUrls();
  const endpoint = `${logistics}/plan`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: location.trim(),
        disaster_type: disasterType.toLowerCase(),
      }),
      signal,
    });

    if (!response.ok) {
      let message = `Failed to create mission plan (HTTP ${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson.detail) message = errJson.detail;
      } catch {
        // fallback
      }
      throw new Error(message);
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    if (err.message?.includes('Failed to fetch')) {
      throw new Error(`Cannot reach Logistics service at ${logistics}/plan.`);
    }
    throw err;
  }
}
