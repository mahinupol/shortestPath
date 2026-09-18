import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Siren, Flame, ShieldAlert, Plus, CheckCircle, Navigation, Clock, AlertTriangle } from 'lucide-react';

export default function EmergencyDispatcher() {
  const { cityData, dispatchEmergency, resolveEmergency, calculateRoute } = useSimulation();

  const [selectedType, setSelectedType] = useState('MEDICAL');
  const [sourceNodeId, setSourceNodeId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('N7');
  const [customTitle, setCustomTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emergencyTypes = [
    { id: 'MEDICAL', label: 'Ambulance Unit', icon: Siren, color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/10' },
    { id: 'FIRE', label: 'Fire & Hazard Truck', icon: Flame, color: 'text-orange-400', bg: 'border-orange-500/30 bg-orange-500/10' },
    { id: 'POLICE', label: 'Police Interceptor', icon: ShieldAlert, color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/10' },
  ];

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!targetNodeId) return;

    setIsSubmitting(true);
    try {
      await dispatchEmergency({
        type: selectedType,
        sourceNodeId: sourceNodeId || null,
        targetNodeId: targetNodeId,
        title: customTitle || undefined,
        description: `Emergency priority response initiated for sector ${targetNodeId}`
      });
      setCustomTitle('');
    } catch {
      // Toast handles error display
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewRoute = (emergency) => {
    if (emergency.sourceNodeId && emergency.targetNodeId) {
      calculateRoute(emergency.sourceNodeId, emergency.targetNodeId, 'EMERGENCY', true);
    }
  };

  const activeEmergenciesList = cityData?.emergencies?.filter(e => e.status !== 'RESOLVED') || [];

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Dispatch Launcher Form Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
            <Siren className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Emergency Dispatch Matrix</h2>
            <p className="text-[11px] text-slate-400">Calculate priority A* corridor with signal preemption</p>
          </div>
        </div>

        <form onSubmit={handleDispatch} className="mt-4 space-y-4">
          {/* Emergency Type Selector */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase tracking-wider">
              1. Select First Responder Unit:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {emergencyTypes.map(t => {
                const Icon = t.icon;
                const isSelected = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected 
                        ? `${t.bg} ring-1 ring-cyan-400 text-white shadow-lg` 
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${t.color}`} />
                    <span className="text-[11px] font-semibold leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Incident Target Node Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Dispatch Origin (Depot):
              </label>
              <select
                value={sourceNodeId}
                onChange={e => setSourceNodeId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="">Auto-Assign Nearest Station</option>
                {cityData?.intersections?.filter(n => n.type !== 'INTERSECTION').map(node => (
                  <option key={node.id} value={node.id}>
                    {node.id} - {node.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Incident Location (Destination):
              </label>
              <select
                value={targetNodeId}
                onChange={e => setTargetNodeId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {cityData?.intersections?.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.id} - {node.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Description/Title */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Incident Incident Call Tag (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Multi-vehicle collision near Downtown Square"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Siren className="w-4 h-4 animate-spin" />
            <span>{isSubmitting ? 'CALCULATING PRIORITY CORRIDOR...' : 'DISPATCH EMERGENCY RESPONSE'}</span>
          </button>
        </form>
      </div>

      {/* Active Emergencies Tracker */}
      <div className="flex-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Active Incident Queue ({activeEmergenciesList.length})
            </h3>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">EMERGENCY PRIORITY ACTIVE</span>
        </div>

        {activeEmergenciesList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-500/40 mb-2" />
            <p className="text-xs font-semibold text-slate-400">All Sectors Clear</p>
            <p className="text-[11px] text-slate-500 mt-1">No active emergency incidents reported.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-3 overflow-y-auto flex-1 pr-1">
            {activeEmergenciesList.map(item => {
              const isFire = item.type === 'FIRE';
              const isPolice = item.type === 'POLICE';
              const iconColor = isFire ? 'text-orange-400' : (isPolice ? 'text-blue-400' : 'text-red-400');
              const borderColor = isFire ? 'border-orange-500/30' : (isPolice ? 'border-blue-500/30' : 'border-red-500/30');

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border bg-slate-950/60 backdrop-blur-sm transition-all ${borderColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                          {item.id}
                        </span>
                        <span className={`text-xs font-bold ${iconColor}`}>{item.type}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.status}
                    </span>
                  </div>

                  {/* Telemetry metadata */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-slate-300 font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px]">ORIGIN</span>
                      <span>{item.sourceNodeId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">INCIDENT SCENE</span>
                      <span className="text-cyan-400">{item.targetNodeId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">ESTIMATED ETA</span>
                      <span className="text-amber-400 font-bold">{Math.round(item.etaSeconds || 0)}s</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleViewRoute(item)}
                      className="flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Highlight Priority Corridor</span>
                    </button>

                    <button
                      onClick={() => resolveEmergency(item.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
