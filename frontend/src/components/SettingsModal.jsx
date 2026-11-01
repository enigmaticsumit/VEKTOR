import React, { useState } from 'react';
import {
  X,
  Settings,
  Server,
  Activity,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { getApiUrls } from '../services/api';

export default function SettingsModal({
  isOpen,
  onClose,
  backendHealth,
  onRecheckHealth,
  historyCount,
  onClearHistory
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const urls = getApiUrls();

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRecheckHealth();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#141416] border border-zinc-800 shadow-2xl p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                System Diagnostics & Settings
              </h3>
              <span className="text-[11px] text-zinc-500">
                VEKTOR Platform Status & Endpoints
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Backend Services Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              Connected Microservices
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Ping Services</span>
            </button>
          </div>

          <div className="space-y-2">
            {/* Intelligence API */}
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">Intelligence Brain</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Port 8001</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono truncate block mt-0.5">
                  {urls.intelligence}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {backendHealth.intelligence.online ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-[11px]">
                    <XCircle className="w-3 h-3" /> Offline
                  </span>
                )}
              </div>
            </div>

            {/* Logistics API */}
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">Logistics Brain</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Port 8002</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono truncate block mt-0.5">
                  {urls.logistics}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {backendHealth.logistics.online ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-[11px]">
                    <XCircle className="w-3 h-3" /> Offline
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Local Storage / History Management */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
          <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider block">
            Local Workspace Data
          </span>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-zinc-200 block font-medium">Cached Analyses</span>
              <span className="text-[11px] text-zinc-500">
                {historyCount} session record(s) stored in browser localStorage
              </span>
            </div>
            {historyCount > 0 && (
              <button
                onClick={onClearHistory}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 border border-zinc-700/80 hover:border-red-500/30 text-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Cache</span>
              </button>
            )}
          </div>
        </div>

        {/* About Info */}
        <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Model Core</span>
            <span className="font-mono text-zinc-300">Gemini 3.1 Flash Lite / Qwen2.5-VL</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Telemetry</span>
            <span className="font-mono text-zinc-300">Open-Meteo & GDELT / Google News RSS</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Routing</span>
            <span className="font-mono text-zinc-300">OSRM & OpenStreetMap Nominatim</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
