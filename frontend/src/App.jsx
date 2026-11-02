import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ResultsView from './components/ResultsView';
import SatelliteViewer from './components/SatelliteViewer';
import ManualPlannerModal from './components/ManualPlannerModal';
import SettingsModal from './components/SettingsModal';
import { checkBackendHealth, runFullAnalysis } from './services/api';
import {
  getStoredAnalyses,
  saveAnalysisToHistory,
  removeAnalysisFromHistory,
  clearAnalysisHistory
} from './utils/history';
import {
  AlertTriangle,
  RotateCcw,
  ServerOff,
  Radio,
  Truck,
  Compass,
  ArrowRight,
  Satellite
} from 'lucide-react';

export default function App() {
  // Navigation & UI States
  const [activeView, setActiveView] = useState('workspace'); // 'workspace' | 'intelligence' | 'logistics'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isManualPlannerOpen, setIsManualPlannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Core Data States
  const [currentResponse, setCurrentResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // History & Health
  const [history, setHistory] = useState([]);
  const [backendHealth, setBackendHealth] = useState({
    intelligence: { online: false, url: '', details: null },
    logistics: { online: false, url: '', details: null }
  });

  const resultsRef = useRef(null);

  // Detect mobile screen width
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load history from localStorage
  useEffect(() => {
    setHistory(getStoredAnalyses());
  }, []);

  // Check backend health on load and periodically
  const refreshHealth = async () => {
    try {
      const health = await checkBackendHealth();
      setBackendHealth(health);
    } catch (err) {
      console.warn('Backend health check error:', err);
    }
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for New Analysis (Ctrl+N or Cmd+N)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewAnalysis();
      }
      if (e.key === 'Escape') {
        setIsManualPlannerOpen(false);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Execute Analysis
  const handleAnalyze = async ({ location, file }) => {
    setIsLoading(true);
    setErrorMessage('');
    setLoadingStep('Accessing multi-source intelligence feeds...');

    // Progress simulation while network request runs
    const timer1 = setTimeout(() => {
      setLoadingStep('Querying GDELT & Google News open feeds...');
    }, 1500);

    const timer2 = setTimeout(() => {
      setLoadingStep('Aggregating Open-Meteo atmospheric telemetry...');
    }, 3800);

    const timer3 = setTimeout(() => {
      if (file) {
        setLoadingStep('Evaluating visual hazard indicators with Gemini Vision...');
      } else {
        setLoadingStep('Evaluating geographic hazard indicators...');
      }
    }, 6500);

    const timer4 = setTimeout(() => {
      setLoadingStep('Computing OSRM transit route & logistics allocation...');
    }, 9500);

    try {
      const data = await runFullAnalysis({ location, file });
      setCurrentResponse(data);

      // Save to local history
      saveAnalysisToHistory(data);
      setHistory(getStoredAnalyses());

      // Auto scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during incident analysis.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Reset / New Analysis
  const handleNewAnalysis = () => {
    setCurrentResponse(null);
    setErrorMessage('');
    setActiveView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select historical analysis
  const handleSelectHistory = (item) => {
    if (item.rawResponse) {
      setCurrentResponse(item.rawResponse);
      setErrorMessage('');
      setActiveView('workspace');
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleClearHistory = () => {
    clearAnalysisHistory();
    setHistory([]);
  };

  const handleRemoveHistoryItem = (id) => {
    const updated = removeAnalysisFromHistory(id);
    setHistory(updated);
  };

  // Handle manual plan creation
  const handleManualPlanCreated = (missionPlan) => {
    if (currentResponse) {
      setCurrentResponse({
        ...currentResponse,
        logistics: {
          status: 'awaiting_human_approval',
          approval_required: true,
          mission: missionPlan,
        },
      });
    } else {
      setCurrentResponse({
        project: 'VEKTOR',
        location: missionPlan.location,
        intelligence: {
          news: null,
          weather: null,
          image_analysis: null,
        },
        logistics: {
          status: 'awaiting_human_approval',
          approval_required: true,
          mission: missionPlan,
        },
      });
    }
    setActiveView('logistics');
  };

  const isBothOffline = !backendHealth.intelligence.online && !backendHealth.logistics.online;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 flex overflow-x-hidden selection:bg-zinc-800 selection:text-white">
      {/* Collapsible / Responsive Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeView={activeView}
        setActiveView={setActiveView}
        onNewAnalysis={handleNewAnalysis}
        history={history}
        onSelectHistory={handleSelectHistory}
        onClearHistory={handleClearHistory}
        onRemoveHistoryItem={handleRemoveHistoryItem}
        backendHealth={backendHealth}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMobile={isMobile}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Workspace Column */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        {/* Sticky Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeView={activeView}
          backendHealth={backendHealth}
          onReset={handleNewAnalysis}
          hasActiveAnalysis={!!currentResponse}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Workspace Body */}
        <main className="flex-1 pb-16 flex flex-col">
          {/* Backend Offline Warning Banner if both services down */}
          {isBothOffline && (
            <div className="mx-4 mt-4 p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-2.5 text-red-300">
                <ServerOff className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Backend Services Offline.</strong> Start Intelligence (:8001) and Logistics (:8002) to run live incident analyses.
                </span>
              </div>
              <button
                onClick={refreshHealth}
                className="px-3 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-medium transition-colors"
              >
                Retry Ping
              </button>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="max-w-3xl mx-auto w-full px-4 mt-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex items-start gap-3 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-semibold text-red-300 block">Analysis Request Failed</span>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage('')}
                  className="text-red-400 hover:text-red-200 text-xs font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Dedicated Satellite Reconnaissance View */}
          {activeView === 'satellite' ? (
            <div className="max-w-4xl mx-auto w-full px-4 py-4 animate-fade-in">
              <SatelliteViewer
                defaultLocationName={currentResponse?.location || 'Jammu'}
                onAnalyzeWithGemini={({ file, location }) => {
                  setActiveView('workspace');
                  handleAnalyze({ location, file });
                }}
              />
            </div>
          ) : (
            <>
              {/* ChatGPT-style Command Bar */}
              <ChatInput
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                loadingStep={loadingStep}
                hasResult={!!currentResponse}
                defaultLocation="Jammu"
              />

              {/* Dynamic Views based on active navigation */}
              {currentResponse ? (
                <div ref={resultsRef}>
                  <ResultsView
                    response={currentResponse}
                    onOpenManualPlanner={() => setIsManualPlannerOpen(true)}
                    onAnalyzeSatellite={({ file, location }) => {
                      handleAnalyze({ location, file });
                    }}
                    activeTab={
                      activeView === 'intelligence'
                        ? 'intelligence'
                        : activeView === 'logistics'
                        ? 'logistics'
                        : 'all'
                    }
                  />
                </div>
              ) : (
                /* Empty State Guidance */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-300">
                      Ready for Incident Query
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Enter an incident location or drag-and-drop disaster imagery to synthesize multi-modal intelligence and relief routing.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveView('satellite')}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Satellite className="w-3.5 h-3.5 text-blue-400" />
                      <span>Copernicus Satellite Recon</span>
                    </button>
                    <button
                      onClick={() => setIsManualPlannerOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Manual Supply Planner</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Manual Supply Planning Modal */}
      <ManualPlannerModal
        isOpen={isManualPlannerOpen}
        onClose={() => setIsManualPlannerOpen(false)}
        initialLocation={currentResponse?.location || 'Jammu'}
        onPlanCreated={handleManualPlanCreated}
      />

      {/* System Settings & Diagnostics Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        backendHealth={backendHealth}
        onRecheckHealth={refreshHealth}
        historyCount={history.length}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
