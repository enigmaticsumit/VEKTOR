import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  UserCheck,
  RotateCcw,
  Info
} from 'lucide-react';

export default function MissionApproval({ mission, logisticsStatus, approvalRequired }) {
  // Demo approval state (local simulation because backend has no approval endpoint)
  const [approvalState, setApprovalState] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'modified'
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalTime, setApprovalTime] = useState(null);

  if (!mission) {
    return (
      <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 text-xs text-zinc-500">
        No active relief mission currently queued for approval.
      </div>
    );
  }

  const handleApprove = () => {
    setApprovalState('approved');
    setApprovalTime(new Date().toLocaleTimeString());
  };

  const handleReject = () => {
    setApprovalState('rejected');
    setApprovalTime(new Date().toLocaleTimeString());
  };

  const handleReset = () => {
    setApprovalState('pending');
    setApprovalTime(null);
    setApprovalNote('');
  };

  return (
    <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">
                Relief Mission Command & Approval
              </h3>
              <span className="font-mono text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                ID #{mission.id || 'NEW'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">
              Human-in-the-loop authorization gate before vehicle dispatch
            </span>
          </div>
        </div>

        {/* State Badge */}
        <div>
          {approvalState === 'approved' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>[Demo] Authorized for Dispatch</span>
            </span>
          )}
          {approvalState === 'rejected' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              <XCircle className="w-3.5 h-3.5" />
              <span>[Demo] Mission Rejected</span>
            </span>
          )}
          {approvalState === 'pending' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              <span>Awaiting Human Approval</span>
            </span>
          )}
        </div>
      </div>

      {/* Mandatory Demo-Only Transparency Disclaimer */}
      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-amber-300 block text-[11px] uppercase tracking-wider">
            Demo-Only Approval Interaction
          </span>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            The VEKTOR logistics backend stores missions in SQLite but does not expose a dedicated persistent approval HTTP endpoint. This authorization action is interactive in the UI for demonstration purposes only.
          </p>
        </div>
      </div>

      {/* Mission Summary Text */}
      <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-1">
        <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">
          Mission Executive Summary
        </span>
        <p className="font-sans leading-relaxed text-zinc-200">
          {mission.mission_summary || `${mission.disaster_type || 'Disaster'} relief mission dispatched to ${mission.destination?.name || 'hub'}.`}
        </p>
        <div className="pt-2 text-[11px] text-zinc-500 flex items-center gap-2">
          <span>Created: <strong className="text-zinc-400 font-mono font-normal">{new Date(mission.created_at || Date.now()).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Interactive Approval Controls */}
      {approvalState === 'pending' ? (
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={handleApprove}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-sm active:scale-95"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve & Authorize Dispatch (Demo)</span>
          </button>

          <button
            onClick={handleReject}
            className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 border border-zinc-700 hover:border-red-500/30 font-medium text-xs flex items-center gap-2 transition-colors active:scale-95"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Mission (Demo)</span>
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-300">
              Demo status recorded at <strong className="font-mono text-zinc-100">{approvalTime}</strong> by Incident Commander.
            </span>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}
