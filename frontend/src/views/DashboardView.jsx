import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import SimulationCanvas from '../components/SimulationCanvas';
import SimpleDispatchConsole from '../components/SimpleDispatchConsole';
import EventTimeline from '../components/EventTimeline';
import VehicleInspectorModal from '../components/VehicleInspectorModal';
import RoadInspectorModal from '../components/RoadInspectorModal';
import { 
  Car, 
  Play, 
  Pause, 
  RotateCcw, 
  Route, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  Trash2,
  Gauge
} from 'lucide-react';

export default function DashboardView() {
  const { 
    simulationState, 
    selectedVehicle, 
    setSelectedVehicle, 
    selectedRoad, 
    setSelectedRoad, 
    selectedNode, 
    setSelectedNode,
    toggleStartPause,
    resetSimulation,
    activeRoute,
    activeDispatchedVehicle,
    mapPickMode,
    setMapPickMode,
    handleMapNodeSelect
  } = useSimulation();

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Telemetry & Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-lg backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Quick City Telemetry */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Car className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">City Fleet</span>
              <span className="text-base font-bold font-mono text-white">
                {simulationState.totalVehicles} <span className="text-xs font-normal text-slate-400">Cars</span>
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Active Route indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Route className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Active Path</span>
              <span className="text-xs font-bold font-mono text-indigo-300">
                {activeRoute ? `${activeRoute.nodeIds?.[0]} ➔ ${activeRoute.nodeIds?.[activeRoute.nodeIds.length - 1]} (${activeRoute.totalDistance}m)` : 'None'}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Active Algorithm */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Routing Engine</span>
              <span className="text-xs font-bold font-mono text-emerald-300">
                {activeRoute?.strategy || 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Simulation Controls (Play/Pause, Reset, Clock) */}
        <div className="flex items-center justify-between sm:justify-end space-x-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{simulationState.formattedSimTime}</span>
          </div>

          <button
            onClick={toggleStartPause}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center space-x-1.5 transition-all border ${
              simulationState.paused
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-amber-500/10'
            }`}
          >
            {simulationState.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{simulationState.paused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          <button
            onClick={resetSimulation}
            title="Reset city to initial baseline"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Interactive Map Pick Mode Banner */}
      {mapPickMode && (
        <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-between shadow-2xl backdrop-blur-md animate-pulse ${
          mapPickMode === 'START' 
            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-400 text-rose-200'
        }`}>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
            <span>
              {mapPickMode === 'START' 
                ? '📍 CLICK ANY INTERSECTION ON THE MAP TO SET START POINT (ORIGIN)' 
                : '🏁 CLICK ANY INTERSECTION ON THE MAP TO SET DESTINATION (END POINT)'}
            </span>
          </div>
          <button
            onClick={() => setMapPickMode(null)}
            className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white text-[11px] font-mono"
          >
            Cancel Pick
          </button>
        </div>
      )}

      {/* Main Core Grid: 3D/2D Canvas (Left) + Simple Dispatch Console (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Interactive Canvas (3D WebGL Skyscrapers + 2D Tactical View) */}
        <div className="xl:col-span-8 h-[440px] sm:h-[520px] md:h-[600px] xl:h-[720px] flex flex-col">
          <SimulationCanvas 
            onSelectNode={(node) => handleMapNodeSelect(node)}
            onSelectRoad={(road) => { setSelectedRoad(road); setSelectedVehicle(null); }}
            onSelectVehicle={(veh) => { setSelectedVehicle(veh); setSelectedRoad(null); }}
          />
        </div>

        {/* User-Driven Vehicle Dispatch & Algorithm Selection Console */}
        <div className="xl:col-span-4 min-h-[520px] xl:h-[720px] flex flex-col">
          <SimpleDispatchConsole />
        </div>
      </div>

      {/* Bottom Feed: Live Real-Time Event Feed */}
      <div className="h-56 sm:h-64">
        <EventTimeline />
      </div>

      {/* Entity Modals when clicked */}
      {selectedVehicle && (
        <VehicleInspectorModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      )}
      {selectedRoad && (
        <RoadInspectorModal road={selectedRoad} onClose={() => setSelectedRoad(null)} />
      )}
    </div>
  );
}
