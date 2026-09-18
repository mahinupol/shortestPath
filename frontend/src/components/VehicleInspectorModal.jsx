import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { X, Gauge, MapPin, Compass, Navigation, ShieldAlert, CheckCircle } from 'lucide-react';

export default function VehicleInspectorModal({ vehicle, onClose }) {
  const { cityData, calculateRoute } = useSimulation();

  if (!vehicle) return null;

  const currentVehicleData = cityData?.vehicles?.find(v => v.id === vehicle.id) || vehicle;
  const isEmergency = currentVehicleData.type?.includes('AMBULANCE') || currentVehicleData.type?.includes('FIRE') || currentVehicleData.type?.includes('POLICE');

  const handleRecalculate = () => {
    if (currentVehicleData.currentNodeId && currentVehicleData.targetNodeId) {
      calculateRoute(currentVehicleData.currentNodeId, currentVehicleData.targetNodeId, 'EMERGENCY', isEmergency);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 w-80 md:w-96 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-5 text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl border ${isEmergency ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'}`}>
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-white">{currentVehicleData.name}</h3>
            <span className="text-[11px] font-mono text-slate-400">ID: {currentVehicleData.id}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 my-4">
        {/* Speed */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telemetry Speed</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-bold font-mono text-cyan-300">{currentVehicleData.speed}</span>
            <span className="text-[10px] text-slate-400">km/h</span>
          </div>
        </div>

        {/* Priority */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <ShieldAlert className={`w-3.5 h-3.5 ${isEmergency ? 'text-red-400' : 'text-amber-400'}`} />
            <span>AOOP Priority</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className={`text-xl font-bold font-mono ${isEmergency ? 'text-red-400' : 'text-slate-200'}`}>
              Level {currentVehicleData.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Route & Progression */}
      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Status:</span>
          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
            {currentVehicleData.status}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Current Node:</span>
          <span className="font-mono text-slate-200">{currentVehicleData.currentNodeId || 'In Transit'}</span>
        </div>

        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Destination:</span>
          <span className="font-mono text-slate-200">{currentVehicleData.targetNodeId || 'Roaming'}</span>
        </div>

        {/* Route Progress Bar */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Segment Progress</span>
            <span>{Math.round((currentVehicleData.roadProgress || 0) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isEmergency ? 'bg-red-500' : 'bg-cyan-400'}`}
              style={{ width: `${Math.min(100, Math.max(0, (currentVehicleData.roadProgress || 0) * 100))}%` }}
            />
          </div>
        </div>

        {currentVehicleData.rerouteCount > 0 && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between">
            <span>Dynamic Reroutes Triggered:</span>
            <span className="font-mono font-bold">{currentVehicleData.rerouteCount}</span>
          </div>
        )}
      </div>

      {/* Recalculate Action */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex space-x-2">
        <button
          onClick={handleRecalculate}
          className="w-full py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors text-center"
        >
          Compute A* Route Overlay
        </button>
      </div>
    </div>
  );
}
