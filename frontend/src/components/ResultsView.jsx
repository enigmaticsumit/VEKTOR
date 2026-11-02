import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Radio,
  Truck,
  Newspaper,
  CloudSun,
  Eye,
  CheckCircle,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  Boxes,
  Satellite
} from 'lucide-react';
import VisionAnalysisCard from './VisionAnalysisCard';
import WeatherCard from './WeatherCard';
import NewsFeed from './NewsFeed';
import LogisticsMap from './LogisticsMap';
import SuppliesTable from './SuppliesTable';
import MissionApproval from './MissionApproval';
import SatelliteViewer from './SatelliteViewer';

export default function ResultsView({
  response,
  onOpenManualPlanner,
  onAnalyzeSatellite,
  activeTab = 'all', // 'all' | 'intelligence' | 'logistics' | 'news' | 'weather' | 'satellite'
}) {
  const [tab, setTab] = useState(activeTab);

  if (!response) return null;

  const location = response.location || 'Unknown Location';
  const intelligence = response.intelligence || {};
  const news = intelligence.news || null;
  const weather = intelligence.weather || null;
  const imageAnalysis = intelligence.image_analysis || null;
  
  const logistics = response.logistics || {};
  const logisticsStatus = logistics.status;
  const mission = logistics.mission || null;
  const approvalRequired = logistics.approval_required || false;

  const disasterType = imageAnalysis?.disaster_type || mission?.disaster_type || 'General Incident';
  const severity = imageAnalysis?.severity || 'Standard';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Target Briefing Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141416] border border-zinc-800/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shrink-0 shadow-md">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
                {location}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium border border-zinc-700/60">
                {disasterType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                Live Incident Evaluation
              </span>
              <span>•</span>
              <span className="text-zinc-500 font-mono text-[11px]">VEKTOR v1.0 Unified Report</span>
            </div>
          </div>
        </div>

        {/* Action button if no logistics mission yet */}
        {!mission && (
          <button
            onClick={onOpenManualPlanner}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Generate Relief Mission</span>
          </button>
        )}
      </div>

      {/* Filter / Section Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'all', label: 'Complete Briefing', icon: Layers },
          { id: 'intelligence', label: 'Vision & Triage', icon: Eye },
          { id: 'satellite', label: 'Satellite Recon', icon: Satellite },
          { id: 'weather', label: 'Weather Telemetry', icon: CloudSun },
          { id: 'news', label: 'News Signals', icon: Newspaper },
          { id: 'logistics', label: 'Relief Logistics', icon: Truck },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* SECTION 1: Multimodal Vision & Weather (Side by side on large screens) */}
        {(tab === 'all' || tab === 'intelligence' || tab === 'weather') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(tab === 'all' || tab === 'intelligence') && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Multimodal Evidence</span>
                </div>
                <VisionAnalysisCard imageAnalysis={imageAnalysis} />
              </div>
            )}

            {(tab === 'all' || tab === 'weather') && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <CloudSun className="w-3.5 h-3.5 text-blue-400" />
                  <span>Meteorological Telemetry</span>
                </div>
                <WeatherCard weatherData={weather} />
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: Open Source Signals & News */}
        {(tab === 'all' || tab === 'news') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Newspaper className="w-3.5 h-3.5 text-blue-400" />
              <span>Open-Source Disaster Signals</span>
            </div>
            <NewsFeed newsData={news} />
          </div>
        )}

        {/* SECTION 3: Emergency Relief Logistics & Routing */}
        {(tab === 'all' || tab === 'logistics') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>Emergency Relief Coordination & Dispatch</span>
              </div>
              {!mission && (
                <button
                  onClick={onOpenManualPlanner}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  <span>Build custom route</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {mission ? (
              <div className="space-y-6">
                {/* Leaflet Transit Route Map */}
                <LogisticsMap
                  route={mission.route}
                  destination={mission.destination}
                  locationName={location}
                />

                {/* Supply Allocation Table */}
                <SuppliesTable supplies={mission.recommended_supplies} />

                {/* Mission Approval Interface (Clearly labeled demo-only) */}
                <MissionApproval
                  mission={mission}
                  logisticsStatus={logisticsStatus}
                  approvalRequired={approvalRequired}
                />
              </div>
            ) : (
              <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <Boxes className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">
                  Automated Logistics Standby
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  {logistics.message ||
                    'Logistics missions trigger automatically when high-confidence visual evidence is classified. You can also manually plan a relief dispatch for this location.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={onOpenManualPlanner}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs inline-flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Plan Relief Mission for {location}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: Sentinel-2 Earth Observation Satellite Recon */}
        {(tab === 'all' || tab === 'satellite') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Satellite className="w-3.5 h-3.5 text-blue-400" />
              <span>Copernicus Sentinel-2 Satellite Reconnaissance</span>
            </div>
            <SatelliteViewer
              defaultLocationName={location}
              defaultLat={weather?.coordinates?.latitude || 32.7353}
              defaultLon={weather?.coordinates?.longitude || 74.8617}
              onAnalyzeWithGemini={onAnalyzeSatellite}
            />
          </div>
        )}
      </div>
    </div>
  );
}
