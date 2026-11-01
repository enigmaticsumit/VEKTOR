import React, { useState } from 'react';
import {
  X,
  Truck,
  MapPin,
  Flame,
  Droplets,
  Wind,
  Mountain,
  Activity,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';
import { createReliefPlan } from '../services/api';

const DISASTERS = [
  { id: 'flood', label: 'Flood', icon: Droplets, color: 'text-blue-400' },
  { id: 'earthquake', label: 'Earthquake', icon: Activity, color: 'text-amber-400' },
  { id: 'wildfire', label: 'Wildfire', icon: Flame, color: 'text-red-400' },
  { id: 'cyclone', label: 'Cyclone', icon: Wind, color: 'text-teal-400' },
  { id: 'landslide', label: 'Landslide', icon: Mountain, color: 'text-amber-600' }
];

export default function ManualPlannerModal({
  isOpen,
  onClose,
  initialLocation = 'Jammu',
  onPlanCreated
}) {
  const [location, setLocation] = useState(initialLocation);
  const [disasterType, setDisasterType] = useState('flood');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const plan = await createReliefPlan({
        location: location.trim(),
        disasterType
      });

      if (onPlanCreated) {
        onPlanCreated(plan);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate mission plan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#141416] border border-zinc-800 shadow-2xl p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Direct Relief Logistics Planner
              </h3>
              <span className="text-[11px] text-zinc-500">
                Targeted supply dispatch route via POST /plan
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>Target Incident Location</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Jammu, Srinagar, New Delhi..."
              disabled={isLoading}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Disaster Type selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">
              Select Disaster Scenario
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DISASTERS.map((d) => {
                const Icon = d.icon;
                const isSelected = disasterType === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDisasterType(d.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-zinc-800 border-blue-500/60 text-white shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${d.color}`} />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!location.trim() || isLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Planning route & supplies...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Generate Mission Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
