import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Clock, MapPin, Building2, Maximize2 } from 'lucide-react';

// Custom sleek dark markers using divIcon (avoids Leaflet default image 404s)
const createOriginIcon = () =>
  L.divIcon({
    className: 'custom-origin-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(59, 130, 246, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const createDestinationIcon = () =>
  L.divIcon({
    className: 'custom-dest-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 24px; height: 24px; border-radius: 6px; background: rgba(16, 185, 129, 0.25); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 4px; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

// Component to automatically fit bounds to the polyline route
function MapController({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
      } catch (err) {
        console.warn('Failed to fit bounds:', err);
      }
    }
  }, [bounds, map]);

  return null;
}

export default function LogisticsMap({ route, destination, locationName }) {
  if (!route || !destination) {
    return (
      <div className="h-64 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-xs text-zinc-500">
        No spatial route data generated for this mission.
      </div>
    );
  }

  const originLat = route.origin?.latitude;
  const originLng = route.origin?.longitude;
  const destLat = destination.latitude;
  const destLng = destination.longitude;

  const geometry = Array.isArray(route.geometry) ? route.geometry : [];
  const distanceKm = (route.distance_m / 1000).toFixed(1);
  const durationMin = Math.round(route.duration_s / 60);
  const durationHours = (durationMin / 60).toFixed(1);

  // Default fallback center
  const center = originLat && originLng ? [originLat, originLng] : [28.6139, 77.209];

  // Calculate bounds
  const bounds = geometry.length > 0
    ? geometry
    : originLat && destLat
    ? [[originLat, originLng], [destLat, destLng]]
    : null;

  return (
    <div className="rounded-xl bg-[#141416] border border-zinc-800/80 overflow-hidden space-y-0">
      {/* Metrics Header Bar */}
      <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800/80 text-blue-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 text-sm">
                Supply Transit Route
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 font-mono text-[10px] text-zinc-400 border border-zinc-700/60">
                OSRM Driving
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span>Origin: <strong className="text-zinc-300 font-medium">{locationName || 'Incident Site'}</strong></span>
              <span>→</span>
              <span>Hub: <strong className="text-emerald-400 font-medium">{destination.name}</strong></span>
            </div>
          </div>
        </div>

        {/* Distance & Duration Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Distance</span>
            <span className="text-xs font-semibold font-mono text-zinc-100">
              {distanceKm} km
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-semibold font-mono text-zinc-100">
              {durationMin > 90 ? `${durationHours} hrs` : `${durationMin} mins`}
            </span>
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative h-80 sm:h-96 w-full bg-[#121214]">
        <MapContainer
          center={center}
          zoom={7}
          scrollWheelZoom={false}
          className="w-full h-full dark-tiles"
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {bounds && <MapController bounds={bounds} />}

          {/* Polyline Route */}
          {geometry.length > 0 && (
            <Polyline
              positions={geometry}
              pathOptions={{
                color: '#3b82f6',
                weight: 4,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: null
              }}
            />
          )}

          {/* Incident Origin Pin */}
          {originLat && originLng && (
            <Marker position={[originLat, originLng]} icon={createOriginIcon()}>
              <Popup>
                <div className="font-sans">
                  <div className="font-semibold text-blue-400 text-xs mb-0.5">
                    Incident Origin
                  </div>
                  <div className="text-[11px] text-zinc-300">
                    {locationName || 'Incident Location'}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">
                    {originLat.toFixed(4)}, {originLng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Relief Destination Pin */}
          {destLat && destLng && (
            <Marker position={[destLat, destLng]} icon={createDestinationIcon()}>
              <Popup>
                <div className="font-sans">
                  <div className="font-semibold text-emerald-400 text-xs mb-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Relief Hub
                  </div>
                  <div className="text-[11px] text-zinc-200 font-medium">
                    {destination.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">
                    {destLat.toFixed(4)}, {destLng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Subtle Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-zinc-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Incident</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-emerald-500" />
            <span>Relief Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 rounded-full" />
            <span>OSRM Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
