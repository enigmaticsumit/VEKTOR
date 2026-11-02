import React from 'react';
import {
  Compass,
  FileText,
  Truck,
  Settings,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Radio,
  Clock,
  MapPin,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Activity,
  Satellite
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onToggle,
  activeView,
  setActiveView,
  onNewAnalysis,
  history,
  onSelectHistory,
  onClearHistory,
  onRemoveHistoryItem,
  backendHealth,
  onOpenSettings,
  isMobile,
  onCloseMobile
}) {
  const isAllHealthy = backendHealth.intelligence.online && backendHealth.logistics.online;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0a0a0a] border-r border-[#222225] transition-all duration-300 ease-in-out ${
          isMobile
            ? isOpen
              ? 'translate-x-0 w-72'
              : '-translate-x-full w-72'
            : isOpen
            ? 'w-64'
            : 'w-16'
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#1f1f23]">
          <div
            onClick={() => {
              setActiveView('workspace');
              if (isMobile) onCloseMobile();
            }}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden select-none"
          >
            {/* Custom VEKTOR geometric logo */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/80 flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M5 6L12 18L19 6" stroke="#f4f4f5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 6L12 13L16 6" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {(isOpen || isMobile) && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm tracking-wider text-zinc-100">VEKTOR</span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 tracking-tight">Disaster Intelligence</span>
              </div>
            )}
          </div>

          {!isMobile && (
            <button
              onClick={onToggle}
              title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            >
              {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* New Analysis Action */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewAnalysis();
              if (isMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all text-xs font-medium group ${
              !isOpen && !isMobile ? 'justify-center px-0' : ''
            }`}
            title="Start New Analysis"
          >
            <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            {(isOpen || isMobile) && <span>New Analysis</span>}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="px-2 py-1 space-y-0.5">
          <button
            onClick={() => {
              setActiveView('workspace');
              if (isMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeView === 'workspace'
                ? 'bg-zinc-800/80 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            } ${!isOpen && !isMobile ? 'justify-center px-0' : ''}`}
            title="Analysis Workspace"
          >
            <Compass className="w-4 h-4 text-zinc-400" />
            {(isOpen || isMobile) && <span>Workspace</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('intelligence');
              if (isMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeView === 'intelligence'
                ? 'bg-zinc-800/80 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            } ${!isOpen && !isMobile ? 'justify-center px-0' : ''}`}
            title="Disaster Intelligence"
          >
            <Radio className="w-4 h-4 text-zinc-400" />
            {(isOpen || isMobile) && <span>Intelligence</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('satellite');
              if (isMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeView === 'satellite'
                ? 'bg-zinc-800/80 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            } ${!isOpen && !isMobile ? 'justify-center px-0' : ''}`}
            title="Copernicus Sentinel-2 Imagery"
          >
            <Satellite className="w-4 h-4 text-blue-400" />
            {(isOpen || isMobile) && <span>Satellite Recon</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('logistics');
              if (isMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeView === 'logistics'
                ? 'bg-zinc-800/80 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            } ${!isOpen && !isMobile ? 'justify-center px-0' : ''}`}
            title="Relief Missions"
          >
            <Truck className="w-4 h-4 text-zinc-400" />
            {(isOpen || isMobile) && <span>Relief Missions</span>}
          </button>
        </div>

        {/* Recent Analyses list */}
        {(isOpen || isMobile) && (
          <div className="flex-1 flex flex-col min-h-0 mt-3 px-2">
            <div className="flex items-center justify-between px-2 pb-1.5 pt-2 border-t border-[#1e1e22]">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-zinc-500" /> Recent Analyses
              </span>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  title="Clear all recent history"
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 pb-2">
              {history.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-zinc-600 italic">
                  No previous analyses yet
                </div>
              ) : (
                history.map((item) => {
                  const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-zinc-800/60 cursor-pointer text-xs transition-colors"
                      onClick={() => {
                        onSelectHistory(item);
                        if (isMobile) onCloseMobile();
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <div className="flex flex-col truncate">
                          <span className="text-zinc-200 truncate font-medium">{item.location}</span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <span>{item.disasterType}</span>
                            <span>·</span>
                            <span>{dateStr}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveHistoryItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 rounded transition-opacity"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Spacer if collapsed */}
        {!isOpen && !isMobile && <div className="flex-1" />}

        {/* Footer with Settings and Backend Status */}
        <div className="p-2 border-t border-[#1f1f23] space-y-1">
          <button
            onClick={() => {
              onOpenSettings();
              if (isMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-colors ${
              !isOpen && !isMobile ? 'justify-center px-0' : ''
            }`}
            title="Settings & System Diagnostics"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            {(isOpen || isMobile) && <span>Settings & Health</span>}
          </button>

          {/* Backend Status indicator */}
          <div
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-[11px] cursor-pointer hover:bg-zinc-900/40 transition-colors ${
              !isOpen && !isMobile ? 'justify-center px-0' : ''
            }`}
            title={`Backend Status: Intelligence (${backendHealth.intelligence.online ? 'Online' : 'Offline'}), Logistics (${backendHealth.logistics.online ? 'Online' : 'Offline'})`}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAllHealthy
                    ? 'bg-emerald-500'
                    : backendHealth.intelligence.online || backendHealth.logistics.online
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
              />
              {isAllHealthy && (
                <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              )}
            </div>
            {(isOpen || isMobile) && (
              <span className="text-zinc-500 truncate">
                {isAllHealthy
                  ? 'Connected (8001 / 8002)'
                  : backendHealth.intelligence.online || backendHealth.logistics.online
                  ? 'Degraded connection'
                  : 'Backend offline'}
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
