import React from 'react';
import {
  Eye,
  AlertTriangle,
  Users,
  CheckCircle2,
  ShieldAlert,
  Info,
  Sparkles,
  Cpu,
  FileCheck,
  HelpCircle,
  CameraOff
} from 'lucide-react';

export default function VisionAnalysisCard({ imageAnalysis, uploadedImageUrl }) {
  if (!imageAnalysis) {
    return (
      <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5">
        <div className="flex items-center gap-2.5 text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
          <CameraOff className="w-4 h-4 text-zinc-500" />
          <span>Multimodal Vision Intelligence</span>
        </div>
        <p className="text-sm text-zinc-400">
          No incident imagery was attached to this analysis run. Telemetry, meteorological sensor data, and open-source news signals were evaluated.
        </p>
        <div className="mt-3 text-xs text-zinc-500 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Attach an image during query to activate edge visual inspection and automatic relief logistics dispatch.</span>
        </div>
      </div>
    );
  }

  // Handle backend vision error or unavailable service
  if (imageAnalysis.status === 'unavailable' || imageAnalysis.status === 'error' || imageAnalysis.error) {
    return (
      <div className="rounded-xl bg-[#141416] border border-amber-900/30 p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-medium uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Vision Analysis Notice</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {imageAnalysis.message || imageAnalysis.error || 'The vision inference pipeline is currently unavailable.'}
        </p>
        <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800 text-[11px] text-zinc-400">
          <span className="font-semibold text-zinc-300 block mb-0.5">Incident Isolation Notice</span>
          <span>
            Open-source news signals, meteorological telemetry, and relief supply coordination remain fully active for this incident.
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800 pt-2.5">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>Configured Engine: {imageAnalysis?.model || (imageAnalysis?.provider === 'gemini' ? 'gemini-3.1-flash-lite' : 'Google Gemini / Ollama')}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">
            AI model
          </span>
        </div>
      </div>
    );
  }

  const {
    disaster_detected,
    disaster_type,
    severity,
    confidence,
    visible_people,
    visual_evidence = [],
    recommended_action,
    verification_status
  } = imageAnalysis;

  // Restrained severity badge styling
  const getSeverityBadge = (sev) => {
    const s = String(sev || '').toLowerCase();
    if (s.includes('high') || s.includes('critical') || s.includes('severe')) {
      return {
        bg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        dot: 'bg-rose-500'
      };
    }
    if (s.includes('medium') || s.includes('moderate')) {
      return {
        bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        dot: 'bg-amber-500'
      };
    }
    return {
      bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      dot: 'bg-emerald-500'
    };
  };

  const severityStyle = getSeverityBadge(severity);
  const confidencePercent = typeof confidence === 'number' ? Math.round(confidence * 100) : null;

  return (
    <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 space-y-4">
      {/* Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>{disaster_type || (disaster_detected ? 'Disaster Detected' : 'No Hazard Detected')}</span>
              {severity && (
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${severityStyle.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${severityStyle.dot}`} />
                  {severity} Severity
                </span>
              )}
            </h3>
            <span className="text-[11px] text-zinc-500">Visual Evidence Triage</span>
          </div>
        </div>

        {/* Confidence meter */}
        {confidencePercent !== null && (
          <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span className="text-[11px] text-zinc-400">Confidence:</span>
            <span className="text-xs font-mono font-semibold text-zinc-100">{confidencePercent}%</span>
            <div className="w-12 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(confidencePercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid of Key Observation Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Visible People */}
        <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex items-center gap-3">
          <div className="p-2 rounded bg-zinc-800/60 text-zinc-300">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 block">Identified Individuals</span>
            <span className="text-sm font-semibold text-zinc-100">
              {visible_people !== undefined && visible_people !== null
                ? `${visible_people} people visible`
                : 'None clearly distinguished'}
            </span>
          </div>
        </div>

        {/* Detection Status */}
        <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex items-center gap-3">
          <div className="p-2 rounded bg-zinc-800/60 text-zinc-300">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 block">Hazard Detection</span>
            <span className="text-sm font-semibold text-zinc-100">
              {disaster_detected ? 'Positive Identification' : 'No Hazard Identified'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Evidence Points */}
      {Array.isArray(visual_evidence) && visual_evidence.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
            Observed Visual Indicators
          </span>
          <ul className="space-y-1">
            {visual_evidence.map((evidence, idx) => (
              <li
                key={idx}
                className="text-xs text-zinc-300 flex items-start gap-2 bg-zinc-900/40 px-3 py-1.5 rounded border border-zinc-800/50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Action */}
      {recommended_action && (
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-200">
          <span className="font-semibold text-blue-300 block mb-0.5 text-[11px] uppercase tracking-wider">
            Recommended Action
          </span>
          <p className="leading-relaxed">{recommended_action}</p>
        </div>
      )}

      {/* Verification Status Banner */}
      <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-medium text-zinc-300 block">
            {verification_status || 'Preliminary assessment'}
          </span>
          <p className="text-[11px] text-zinc-500">
            Model assists preliminary visual triage. Field teams must conduct ground-truth verification prior to tactical deployment.
          </p>
        </div>
      </div>

      {/* Mandatory Model Attribution */}
      <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-zinc-400 font-medium">
            Image analysis powered by {imageAnalysis?.model ? `${imageAnalysis.model}` : (imageAnalysis?.provider === 'gemini' ? 'gemini-3.1-flash-lite' : 'Qwen2.5-VL 3B')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px] border border-zinc-700/60">
            AI model
          </span>
          <span className="text-[10px] text-zinc-600">Non-autonomous verification</span>
        </div>
      </div>
    </div>
  );
}
