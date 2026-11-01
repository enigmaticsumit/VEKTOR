import React from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function WeatherCard({ weatherData }) {
  if (!weatherData) {
    return (
      <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 text-xs text-zinc-500">
        No meteorological telemetry available.
      </div>
    );
  }

  if (weatherData.status === 'rate_limited' || weatherData.status === 'error' || weatherData.error || !weatherData.weather) {
    const isRateLimited = weatherData.status === 'rate_limited';
    return (
      <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{isRateLimited ? 'Meteorological Telemetry Rate Limited' : 'Weather Data Notice'}</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {weatherData.message || weatherData.error || 'Meteorological telemetry is temporarily unavailable.'}
        </p>
        {weatherData.coordinates && (
          <div className="text-[11px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
            Coordinates: {weatherData.coordinates.latitude?.toFixed(2)}°, {weatherData.coordinates.longitude?.toFixed(2)}°
          </div>
        )}
      </div>
    );
  }

  const {
    location,
    country,
    coordinates,
    weather = {},
    units = {},
    source = 'Open-Meteo',
    observation_time
  } = weatherData;

  const temp = weather.temperature_2m;
  const tempUnit = units.temperature_2m || '°C';
  const feelsLike = weather.apparent_temperature;
  const humidity = weather.relative_humidity_2m;
  const humidityUnit = units.relative_humidity_2m || '%';
  const windSpeed = weather.wind_speed_10m;
  const windUnit = units.wind_speed_10m || 'km/h';
  const windDir = weather.wind_direction_10m;
  const precipitation = weather.precipitation ?? weather.rain ?? 0;
  const precipUnit = units.precipitation || units.rain || 'mm';
  const description = weather.description || 'Current Atmospheric State';

  // Weather icon based on code
  const getWeatherIcon = (code) => {
    if (code === undefined || code === null) return <Cloud className="w-6 h-6 text-blue-400" />;
    if (code === 0 || code === 1) return <Sun className="w-6 h-6 text-amber-400" />;
    if (code === 2 || code === 3) return <Cloud className="w-6 h-6 text-zinc-300" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-6 h-6 text-blue-400" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-6 h-6 text-blue-200" />;
    if (code >= 80 && code <= 82) return <CloudRain className="w-6 h-6 text-blue-500" />;
    if (code >= 95) return <CloudLightning className="w-6 h-6 text-amber-400" />;
    return <Cloud className="w-6 h-6 text-zinc-400" />;
  };

  const formattedTime = observation_time
    ? new Date(observation_time).toLocaleString([], {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    : null;

  return (
    <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-zinc-800/70 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            {getWeatherIcon(weather.weather_code)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">
                {location || 'Target Area'}
              </span>
              {country && (
                <span className="text-[11px] text-zinc-500 font-medium">({country})</span>
              )}
            </div>
            <span className="text-xs text-zinc-400 block font-medium">
              {description}
            </span>
          </div>
        </div>

        {/* Big Temperature Display */}
        {temp !== undefined && temp !== null && (
          <div className="text-right">
            <span className="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
              {temp > 0 ? `+${temp}` : temp}
              <span className="text-base text-zinc-400 ml-0.5">{tempUnit}</span>
            </span>
            {feelsLike !== undefined && feelsLike !== null && (
              <span className="text-[11px] text-zinc-500 block">
                Feels like {feelsLike}{tempUnit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Meteorological Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Humidity */}
        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] mb-1">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>Humidity</span>
          </div>
          <span className="text-xs font-semibold font-mono text-zinc-200">
            {humidity !== undefined ? `${humidity} ${humidityUnit}` : 'N/A'}
          </span>
        </div>

        {/* Wind Speed & Direction */}
        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] mb-1">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>Wind</span>
          </div>
          <span className="text-xs font-semibold font-mono text-zinc-200">
            {windSpeed !== undefined ? `${windSpeed} ${windUnit}` : 'N/A'}
            {windDir !== undefined && <span className="text-[10px] text-zinc-500 ml-1">({windDir}°)</span>}
          </span>
        </div>

        {/* Precipitation */}
        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] mb-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>Precipitation</span>
          </div>
          <span className="text-xs font-semibold font-mono text-zinc-200">
            {precipitation !== undefined ? `${precipitation} ${precipUnit}` : '0 mm'}
          </span>
        </div>

        {/* Coordinates */}
        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] mb-1">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Coordinates</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-300 block truncate">
            {coordinates?.latitude?.toFixed(2)}°, {coordinates?.longitude?.toFixed(2)}°
          </span>
        </div>
      </div>

      {/* Footer attribution & time */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
        <div className="flex items-center gap-2">
          <span>Source: <strong className="text-zinc-400 font-normal">{source}</strong></span>
          {weatherData.cached && (
            <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
              Cached Telemetry
            </span>
          )}
        </div>
        {formattedTime && (
          <span className="flex items-center gap-1 text-[10px]">
            <Clock className="w-3 h-3 text-zinc-600" />
            Observed {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
}
