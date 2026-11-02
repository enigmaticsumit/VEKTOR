import React from 'react';
import { Menu, RotateCcw, Activity, Shield, Sparkles, ExternalLink } from 'lucide-react';

export default function Header({
  onToggleSidebar,
  activeView,
  backendHealth,
  onReset,
  hasActiveAnalysis,
  onOpenSettings,
}) {
  const getTitle = () => {
    switch (activeView) {
      case 'intelligence':
        return 'Disaster Intelligence Feed';
      case 'satellite':
        return 'Sentinel-2 Satellite Reconnaissance';
      case 'logistics':
        return 'Relief Supply & Mission Dispatch';
      default:
        return 'Incident Command Workspace';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#0d0d0d]/80 backdrop-blur-md border-b border-[#1f1f23] px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors focus:outline-none"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-zinc-200 tracking-tight">
            {getTitle()}
          </h1>
          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-zinc-700" />
          <span className="hidden sm:inline-block text-xs text-zinc-500 font-mono">
            VEKTOR v1.0
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend health pills */}
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] cursor-pointer hover:border-zinc-700 transition-colors"
          title="Click to view backend service status"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendHealth.intelligence.online ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span className="text-zinc-400 hidden sm:inline">Intel</span>
            <span className="text-zinc-600 font-mono text-[10px]">8001</span>
          </div>

          <span className="text-zinc-700">|</span>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendHealth.logistics.online ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span className="text-zinc-400 hidden sm:inline">Logistics</span>
            <span className="text-zinc-600 font-mono text-[10px]">8002</span>
          </div>
        </div>

        {hasActiveAnalysis && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors"
            title="Reset current view and start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        )}
      </div>
    </header>
  );
}
