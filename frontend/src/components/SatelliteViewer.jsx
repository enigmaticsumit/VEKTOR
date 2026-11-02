import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Globe,
  Calendar,
  Cloud,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ZoomIn,
  X,
  Compass,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { fetchSentinel2Imagery, base64ToFile } from '../services/api';

const PRESET_COORDINATES = [
  { name: 'Jammu', lat: 32.7353, lon: 74.8617, desc: 'Tawi River Basin' },
  { name: 'Srinagar', lat: 34.0837, lon: 74.7973, desc: 'Jhelum Valley' },
  { name: 'Shimla', lat: 31.1048, lon: 77.1734, desc: 'Himalayan Ridge' },
  { name: 'New Delhi', lat: 28.6139, lon: 77.2090, desc: 'Yamuna Floodplain' },
  { name: 'Leh', lat: 34.1526, lon: 77.5771, desc: 'Ladakh High Plateau' },
];

export default function SatelliteViewer({
  defaultLat = 32.7353,
  defaultLon = 74.8617,
  defaultLocationName = 'Jammu',
  onAnalyzeWithGemini,
  compact = false,
}) {
  const [latitude, setLatitude] = useState(defaultLat);
  const [longitude, setLongitude] = useState(defaultLon);
  const [locationLabel, setLocationLabel] = useState(defaultLocationName);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [maxCloudCover, setMaxCloudCover] = useState(60);

  const [isLoading, setIsLoading] = useState(false);
  const [satelliteData, setSatelliteData] = useState(null);
  const [error, setError] = useState('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Sync if defaultLat/Lon changes externally
  useEffect(() => {
    if (defaultLat && defaultLon) {
      setLatitude(defaultLat);
      setLongitude(defaultLon);
      if (defaultLocationName) setLocationLabel(defaultLocationName);
    }
  }, [defaultLat, defaultLon, defaultLocationName]);

  const handleFetch = async (e) => {
    if (e) e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Please provide a valid latitude between -90 and 90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Please provide a valid longitude between -180 and 180.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSatelliteData(null);

    try {
      const data = await fetchSentinel2Imagery({
        latitude: lat,
        longitude: lon,
        days: lookbackDays,
        maxCloudCover: maxCloudCover,
      });

      if (data.status === 'no_data') {
        setError(data.message || 'No Sentinel-2 imagery available for the given criteria.');
      } else {
        setSatelliteData(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to acquire Sentinel-2 imagery.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset) => {
    setLatitude(preset.lat);
    setLongitude(preset.lon);
    setLocationLabel(preset.name);
    setError('');
  };

  const handleSendToGemini = () => {
    if (!satelliteData?.preview_base64) return;
    try {
      const filename = `${satelliteData.product_name || 'sentinel2'}_preview.jpg`;
      const file = base64ToFile(satelliteData.preview_base64, filename);
      if (onAnalyzeWithGemini) {
        onAnalyzeWithGemini({
          file,
          location: locationLabel || `${latitude}, ${longitude}`,
          coordinates: { latitude, longitude },
          source: 'Copernicus Sentinel-2',
        });
      }
    } catch (err) {
      setError(`Failed to prepare image for Gemini analysis: ${err.message}`);
    }
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return 'Recent Pass';
    try {
      const d = new Date(isoStr);
      return d.toUTCString().replace('GMT', 'UTC');
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="rounded-2xl bg-[#141416] border border-zinc-800/80 p-4 sm:p-6 shadow-xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400 shrink-0 shadow-sm">
            <Satellite className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-100">
                Sentinel-2 Earth Observation Satellite
              </h3>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                ESA CDSE
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Direct telemetry from Copernicus Data Space Ecosystem (MSI Optical Sensor • 10m Ground Resolution)
            </p>
          </div>
        </div>

        {/* Preset Location Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_COORDINATES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                Math.abs(latitude - preset.lat) < 0.01 && Math.abs(longitude - preset.lon) < 0.01
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
              title={`${preset.desc} (${preset.lat}, ${preset.lon})`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Query Controls Form */}
      <form onSubmit={handleFetch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Latitude */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-400" /> Latitude (°N)
            </label>
            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 32.7353"
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Longitude */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-400" /> Longitude (°E)
            </label>
            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 74.8617"
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Date Range / Lookback */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400" /> Acquisition Window
            </label>
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value={7}>Last 7 Days (Fresh pass)</option>
              <option value={15}>Last 15 Days</option>
              <option value={30}>Last 30 Days (Standard)</option>
              <option value={60}>Last 60 Days</option>
              <option value={120}>Last 120 Days (Broad survey)</option>
            </select>
          </div>

          {/* Max Cloud Cover */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-zinc-400" /> Max Cloud Cover
            </label>
            <select
              value={maxCloudCover}
              onChange={(e) => setMaxCloudCover(Number(e.target.value))}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value={20}>&le; 20% (Pristine view)</option>
              <option value={40}>&le; 40% (Balanced)</option>
              <option value={60}>&le; 60% (Moderate)</option>
              <option value={100}>Any (Up to 100%)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Connects via Copernicus OAuth Client Credentials to CDSE OData v1 API.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Copernicus Orbital Passes...</span>
              </>
            ) : (
              <>
                <Satellite className="w-3.5 h-3.5" />
                <span>Fetch Satellite Image</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <span className="font-semibold text-amber-300">Satellite Query Notice</span>
            <p className="text-amber-200/90 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-amber-400 hover:text-amber-200 text-xs font-medium"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Satellite Imagery Result Card */}
      {satelliteData && (
        <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 sm:p-5 space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-sm font-semibold text-zinc-100">
                Orbital Acquisition Confirmed
              </h4>
              <span className="text-xs text-zinc-400">
                ({latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendToGemini}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                title="Send satellite image to Gemini Vision for disaster assessment"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Analyze with Gemini Vision</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Image Preview Container */}
            <div className="relative group/preview rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 aspect-square max-h-[340px] flex items-center justify-center">
              <img
                src={satelliteData.preview_base64}
                alt={`Sentinel-2 pass over ${locationLabel}`}
                className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => setIsZoomOpen(true)}
              />

              {/* Overlay badges */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-zinc-200">
                  Sentinel-2
                </span>
                {satelliteData.cloud_cover !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-md backdrop-blur-sm border text-[10px] font-mono font-medium ${
                      satelliteData.cloud_cover < 15
                        ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                        : satelliteData.cloud_cover < 50
                        ? 'bg-amber-950/80 border-amber-700/60 text-amber-300'
                        : 'bg-red-950/80 border-red-700/60 text-red-300'
                    }`}
                  >
                    {satelliteData.cloud_cover}% Cloud
                  </span>
                )}
              </div>

              {/* Zoom Trigger */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-black text-white/90 border border-white/20 transition-all opacity-0 group-hover/preview:opacity-100"
                title="Enlarge satellite image"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata & Assessment Details */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                  Product Identifier
                </span>
                <p className="text-xs font-mono text-zinc-300 break-all bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                  {satelliteData.product_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                    Acquisition Time
                  </span>
                  <span className="font-medium text-zinc-200 block text-[11px]">
                    {formatTimestamp(satelliteData.acquisition_date)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                    Cloud Obscuration
                  </span>
                  <span className="font-semibold text-zinc-200 block text-xs">
                    {satelliteData.cloud_cover !== null ? `${satelliteData.cloud_cover}%` : 'Not Reported'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                    Sensor / Payload
                  </span>
                  <span className="font-medium text-zinc-300 block text-xs">
                    MSI (13 Spectral Bands)
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                    Source Network
                  </span>
                  <span className="font-medium text-zinc-300 block text-xs truncate" title={satelliteData.source}>
                    Copernicus CDSE
                  </span>
                </div>
              </div>

              {/* Multimodal Action Banner */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Multimodal Vision Triage Ready</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Send this Copernicus optical pass directly to Google Gemini Vision (<code>gemini-3.1-flash-lite</code>) to detect inundation boundaries, mudslide flows, infrastructure disruption, and calculate recommended relief dispatches.
                </p>
                <button
                  type="button"
                  onClick={handleSendToGemini}
                  className="w-full mt-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Launch Unified Analysis with this Satellite Pass</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && satelliteData?.preview_base64 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/80 hover:bg-black text-white border border-zinc-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={satelliteData.preview_base64}
              alt="Sentinel-2 Full Preview"
              className="w-full h-auto max-h-[82vh] object-contain rounded-xl"
            />
            <div className="p-3 text-xs text-zinc-400 flex items-center justify-between">
              <span>{satelliteData.product_name}</span>
              <span>Acquired: {formatTimestamp(satelliteData.acquisition_date)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
