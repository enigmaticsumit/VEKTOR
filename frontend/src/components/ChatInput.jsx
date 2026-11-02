import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Paperclip,
  ArrowUp,
  X,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  AlertCircle,
  FileText,
  Satellite,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import SatelliteViewer from './SatelliteViewer';

export default function ChatInput({
  onAnalyze,
  isLoading,
  loadingStep,
  hasResult,
  defaultLocation = 'Jammu'
}) {
  const [location, setLocation] = useState(defaultLocation);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showSatellite, setShowSatellite] = useState(false);
  const [isSatelliteOrigin, setIsSatelliteOrigin] = useState(false);
  
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Generate preview when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setFilePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setFilePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    setValidationError('');
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setValidationError('Supported formats: JPG, PNG, WEBP (under 10MB)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError('Image exceeds 10MB size limit');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setIsSatelliteOrigin(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSatelliteAnalyze = ({ file, location: satLoc }) => {
    setSelectedFile(file);
    setIsSatelliteOrigin(true);
    setShowSatellite(false);
    const finalLocation = satLoc || location;
    if (satLoc) {
      setLocation(satLoc);
    }
    onAnalyze({
      location: finalLocation,
      file,
    });
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!location.trim() || isLoading) return;

    onAnalyze({
      location: location.trim(),
      file: selectedFile
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectQuickPrompt = (promptLocation) => {
    setLocation(promptLocation);
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  return (
    <div className={`w-full max-w-3xl mx-auto px-4 transition-all duration-300 ${hasResult ? 'py-4' : 'pt-12 pb-16'}`}>
      {/* Welcome Hero (visible when no analysis active) */}
      {!hasResult && (
        <div className="text-center space-y-3 mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Incident Verification & Response System
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
            Disaster intelligence, unified.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            VEKTOR fuses multi-source open signals, meteorological telemetry, multimodal computer vision, and relief supply routing into an actionable incident picture.
          </p>

          {/* Quick Scenario Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              { loc: 'Jammu', tag: 'Flash Flood / Landslide' },
              { loc: 'Srinagar', tag: 'Snowstorm & Road Closures' },
              { loc: 'New Delhi', tag: 'Urban Monsoon Inundation' },
              { loc: 'Shimla', tag: 'Slope Instability' }
            ].map((item) => (
              <button
                key={item.loc}
                type="button"
                onClick={() => handleSelectQuickPrompt(item.loc)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-xs text-zinc-300 transition-all flex items-center gap-1.5"
              >
                <MapPin className="w-3 h-3 text-blue-400" />
                <span className="font-medium">{item.loc}</span>
                <span className="text-zinc-500 text-[10px]">({item.tag})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Command Input Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl bg-[#141416] border transition-all duration-200 shadow-2xl ${
          isDragging
            ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20'
            : 'border-zinc-800 hover:border-zinc-700/80 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600'
        }`}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        {/* Selected Image Preview Pill */}
        {filePreview && (
          <div className="p-3 pb-0 flex items-center gap-3">
            <div className="relative group/thumb rounded-lg overflow-hidden border border-zinc-700 w-14 h-14 bg-zinc-900 shrink-0">
              <img
                src={filePreview}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase font-mono">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </span>
                {isSatelliteOrigin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                    Sentinel-2
                  </span>
                )}
              </div>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-blue-400" />
                {isSatelliteOrigin
                  ? 'Sentinel-2 earth observation pass ready for Gemini Vision evaluation'
                  : 'Ready for AI multimodal visual analysis'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center p-2.5 sm:p-3 gap-2">
          {/* Location icon & label */}
          <div className="flex items-center gap-1.5 text-zinc-400 pl-1.5 shrink-0">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-zinc-500 hidden sm:inline">Target:</span>
          </div>

          {/* Location text input */}
          <input
            ref={textInputRef}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Enter incident location (e.g. Jammu, Srinagar, Shimla)..."
            className="flex-1 bg-transparent border-0 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0 px-1 disabled:opacity-50"
          />

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Satellite Imagery Recon Toggle */}
            <button
              type="button"
              onClick={() => setShowSatellite(!showSatellite)}
              disabled={isLoading}
              title={showSatellite ? 'Hide Satellite Recon' : 'Fetch Copernicus Sentinel-2 satellite pass'}
              className={`p-2 rounded-xl transition-all ${
                showSatellite
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              } disabled:opacity-40`}
            >
              <Satellite className="w-4 h-4" />
            </button>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title={selectedFile ? 'Change image' : 'Attach disaster image (JPG, PNG, WEBP)'}
              className={`p-2 rounded-xl transition-all ${
                selectedFile
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              } disabled:opacity-40`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Analyze / Submit Button */}
            <button
              type="submit"
              disabled={!location.trim() || isLoading}
              title="Run Unified Analysis (Enter)"
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  <span className="hidden sm:inline text-zinc-400">Analyzing...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Analyze</span>
                  <ArrowUp className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Validation error notice */}
        {validationError && (
          <div className="px-3 pb-2 text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Copernicus Sentinel-2 Satellite Recon Drawer */}
      {showSatellite && (
        <div className="mt-4 animate-fade-in">
          <SatelliteViewer
            defaultLocationName={location}
            onAnalyzeWithGemini={handleSatelliteAnalyze}
          />
        </div>
      )}

      {/* Real-time Progress Bar while running */}
      {isLoading && (
        <div className="mt-4 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-lg animate-fade-in space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              {loadingStep || 'Querying real-time intelligence channels...'}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">Live Telemetry</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4 transition-all duration-500" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>• Open-Meteo & GDELT</span>
            <span>• Gemini Vision AI</span>
            <span>• OSRM Routing Engine</span>
          </div>
        </div>
      )}
    </div>
  );
}
