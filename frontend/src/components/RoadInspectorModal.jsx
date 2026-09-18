import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { X, AlertOctagon, RefreshCw, Gauge, Route, Zap } from 'lucide-react';
import { api } from '../api/client';

export default function RoadInspectorModal({ road, onClose }) {
  const { cityData, toggleRoadBlock, refreshCityData, addToast } = useSimulation();

  if (!road) return null;

  const currentRoadData = cityData?.roads?.find(r => r.id === road.id) || road;

  const handleSetTraffic = async (lvl) => {
    try {
      await api.updateTraffic(currentRoadData.id, lvl);
      addToast(`Traffic on ${currentRoadData.name} set to ${lvl}`, 'info');
      await refreshCityData();
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 w-80 md:w-96 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-5 text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl border ${currentRoadData.blocked ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'}`}>
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-white">{currentRoadData.name}</h3>
            <span className="text-[11px] font-mono text-slate-400">ID: {currentRoadData.id}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Road Segment Details */}
      <div className="grid grid-cols-2 gap-3 my-4 text-xs">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <span className="text-slate-400 block mb-1">Segment Distance</span>
          <span className="text-lg font-bold font-mono text-cyan-300">{currentRoadData.distance}m</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <span className="text-slate-400 block mb-1">Speed Limit</span>
          <span className="text-lg font-bold font-mono text-cyan-300">{currentRoadData.speedLimit} km/h</span>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-300">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Endpoints:</span>
          <span className="font-mono text-cyan-400">{currentRoadData.sourceNodeId} ➔ {currentRoadData.targetNodeId}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Travel Time:</span>
          <span className="font-mono text-slate-200">
            {currentRoadData.blocked ? '∞ (Blocked)' : `${currentRoadData.travelTimeSeconds}s`}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Congestion Level:</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono"
            style={{ 
              backgroundColor: currentRoadData.blocked ? '#ef444433' : `${currentRoadData.color}33`,
              color: currentRoadData.blocked ? '#ef4444' : currentRoadData.color,
              border: `1px solid ${currentRoadData.blocked ? '#ef4444' : currentRoadData.color}` 
            }}
          >
            {currentRoadData.blocked ? 'BLOCKED' : currentRoadData.trafficLevel}
          </span>
        </div>

        {/* Traffic Level Preset Buttons */}
        {!currentRoadData.blocked && (
          <div className="pt-2">
            <span className="text-[10px] text-slate-400 block mb-1.5">Adjust Road Congestion:</span>
            <div className="grid grid-cols-4 gap-1">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => handleSetTraffic(lvl)}
                  className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    currentRoadData.trafficLevel === lvl
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Block / Restore Toggle Button */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <button
          onClick={() => toggleRoadBlock(currentRoadData.id)}
          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center space-x-2 ${
            currentRoadData.blocked
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>{currentRoadData.blocked ? 'RESTORE ROAD ACCESS' : 'BLOCK ROAD (Simulate Closure)'}</span>
        </button>
      </div>
    </div>
  );
}
