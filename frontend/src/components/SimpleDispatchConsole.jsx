import React, { useState, useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { 
  Navigation, 
  Send, 
  Trash2, 
  Car, 
  Siren, 
  Shield, 
  Flame, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Gauge, 
  MapPin, 
  Clock, 
  Route, 
  RotateCcw,
  Sparkles,
  Zap,
  MousePointerClick,
  FastForward
} from 'lucide-react';

const VEHICLE_TYPES = [
  { id: 'CAR', label: 'Civilian Car', icon: Car, color: 'cyan', baseDefault: 55 },
  { id: 'AMBULANCE', label: 'Ambulance', icon: Siren, color: 'red', baseDefault: 75 },
  { id: 'POLICE', label: 'Police Cruiser', icon: Shield, color: 'blue', baseDefault: 80 },
  { id: 'FIRE_TRUCK', label: 'Fire Truck', icon: Flame, color: 'amber', baseDefault: 65 },
];

const ALGORITHMS = [
  { 
    id: 'ASTAR_TRAFFIC', 
    name: 'A* Algorithm (Traffic-Aware)', 
    badge: 'Fastest', 
    desc: 'Uses F(n) = G(n) + H(n) heuristic with real-time congestion weights',
    tagColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
  },
  { 
    id: 'DIJKSTRA', 
    name: "Dijkstra's Algorithm", 
    badge: 'Classic', 
    desc: 'Uniform-cost search exploring minimal cumulative road cost (H=0)',
    tagColor: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
  },
  { 
    id: 'SHORTEST', 
    name: 'Shortest Distance (A*)', 
    badge: 'Spatial', 
    desc: 'Pure Euclidean physical distance optimization bypassing traffic factor',
    tagColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
  },
  { 
    id: 'EMERGENCY', 
    name: 'Emergency Priority Corridor', 
    badge: 'Green Wave', 
    desc: 'Forces green traffic lights along trajectory for maximum clearance',
    tagColor: 'border-red-500/40 text-red-400 bg-red-500/10'
  },
];

const DEFAULT_INTERSECTIONS = [
  { id: 'N1', name: 'Junction N1 (North Shore)' },
  { id: 'N2', name: 'North Shore Fire Station' },
  { id: 'N3', name: 'North Memorial Hospital' },
  { id: 'N4', name: 'Junction N4 (North Campus)' },
  { id: 'N5', name: 'North Precinct Police Station' },
  { id: 'N6', name: 'Junction N6 (Industrial Way)' },
  { id: 'N7', name: 'Neo City Mega Mall' },
  { id: 'N8', name: 'Junction N8 (Midtown North)' },
  { id: 'N9', name: 'Civic Center & City Hall' },
  { id: 'N10', name: 'Junction N10 (East Gate)' },
  { id: 'N11', name: 'Tech Hub Boulevard' },
  { id: 'N12', name: 'Junction N12 (Uptown)' },
  { id: 'N13', name: 'Central General Hospital' },
  { id: 'N14', name: 'Junction N14 (Financial District)' },
  { id: 'N15', name: 'Grand Central Plaza' },
  { id: 'N16', name: 'Westview Overpass' },
  { id: 'N17', name: 'Junction N17 (Arts Quarter)' },
  { id: 'N18', name: 'Innovation Park' },
  { id: 'N19', name: 'Grand Central Transit Hub' },
  { id: 'N20', name: 'Bayside Parkway' },
  { id: 'N21', name: 'Metro Police Headquarters' },
  { id: 'N22', name: 'Harbor Fire Headquarters' },
  { id: 'N23', name: 'South Coast Trauma Center' },
  { id: 'N24', name: 'Junction N24 (Cargo Port)' },
  { id: 'N25', name: 'Junction N25 (Bayside)' }
];

export default function SimpleDispatchConsole() {
  const { 
    cityData, 
    deployVehicle, 
    clearAllVehicles, 
    activeDispatchedVehicle, 
    activeRoute,
    simulationState,
    mapPickMode,
    setMapPickMode,
    dispatchStartNode,
    setDispatchStartNode,
    dispatchTargetNode,
    setDispatchTargetNode,
    dispatchSpeed,
    setDispatchSpeed,
    changeVehicleSpeed
  } = useSimulation();

  const [selectedType, setSelectedType] = useState('CAR');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('ASTAR_TRAFFIC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Intersections sorted N1 to N25 with fallback
  const intersections = useMemo(() => {
    const list = cityData?.intersections || cityData?.nodes;
    if (list && list.length > 0) {
      return [...list].sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
    }
    return DEFAULT_INTERSECTIONS;
  }, [cityData]);

  const handleSwap = () => {
    const temp = dispatchStartNode;
    setDispatchStartNode(dispatchTargetNode);
    setDispatchTargetNode(temp);
  };

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    const matched = VEHICLE_TYPES.find(v => v.id === typeId);
    if (matched && matched.baseDefault) {
      setDispatchSpeed(matched.baseDefault);
    }
  };

  const handleDispatch = async (e) => {
    e?.preventDefault();
    if (!dispatchStartNode || !dispatchTargetNode) return;
    if (dispatchStartNode === dispatchTargetNode) {
      alert('Start and Destination points must be different intersections.');
      return;
    }

    setIsSubmitting(true);
    try {
      await deployVehicle({
        type: selectedType,
        startNodeId: dispatchStartNode,
        targetNodeId: dispatchTargetNode,
        algorithm: selectedAlgorithm,
        speed: dispatchSpeed,
      });
      setMapPickMode(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress computation for the actively dispatched vehicle
  const tripProgressPercent = useMemo(() => {
    if (!activeDispatchedVehicle) return 0;
    if (activeDispatchedVehicle.status === 'ARRIVED') return 100;
    const totalSegments = Math.max(1, (activeDispatchedVehicle.routeNodeIds?.length || 1) - 1);
    const currIdx = activeDispatchedVehicle.currentRouteIndex || 0;
    const roadProg = activeDispatchedVehicle.roadProgress || 0;
    const computed = ((currIdx + roadProg) / totalSegments) * 100;
    return Math.min(99, Math.max(0, Math.round(computed)));
  }, [activeDispatchedVehicle]);

  const hasArrived = activeDispatchedVehicle?.status === 'ARRIVED';

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col h-full space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white tracking-wide uppercase font-mono flex items-center space-x-1.5">
              <span>Vehicle Dispatch Console</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-400">Select vehicle, points, speed & algorithm</p>
          </div>
        </div>

        {/* Clear All Vehicles button */}
        <button
          type="button"
          onClick={clearAllVehicles}
          title="Remove all vehicles to restart with an empty city"
          className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 text-[11px] font-mono flex items-center space-x-1.5 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Cars</span>
        </button>
      </div>

      {/* Dispatch Form */}
      <form onSubmit={handleDispatch} className="space-y-4">
        {/* Step 1: Vehicle Type */}
        <div>
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 block flex items-center space-x-1.5">
            <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center">1</span>
            <span>Select Vehicle Type</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {VEHICLE_TYPES.map(v => {
              const Icon = v.icon;
              const isSelected = selectedType === v.id;
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => handleTypeSelect(v.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center text-center space-y-1 ${
                    isSelected 
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-500/10 text-white ring-1 ring-cyan-400/50' 
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold">{v.label}</span>
                  <span className="text-[9px] font-mono opacity-70">{v.baseDefault} km/h base</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Origin & Destination Intersections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center">2</span>
              <span>Start & Destination Points</span>
            </label>

            {/* Combined Pick Route on Map trigger */}
            <button
              type="button"
              onClick={() => setMapPickMode(mapPickMode ? null : 'START')}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
                mapPickMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>{mapPickMode ? 'Cancel Map Pick' : '🎯 Pick on Map'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
            {/* Start Point */}
            <div className={`sm:col-span-5 rounded-xl p-2.5 border transition-all ${
              mapPickMode === 'START'
                ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-slate-800/70 border-slate-700/70'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Start (Origin)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMapPickMode(mapPickMode === 'START' ? null : 'START')}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono flex items-center space-x-1 border transition-all ${
                    mapPickMode === 'START'
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 animate-pulse'
                      : 'bg-slate-800/80 text-emerald-400 border-slate-700 hover:bg-emerald-500/20'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{mapPickMode === 'START' ? 'Click Map...' : 'Pick Map'}</span>
                </button>
              </div>
              <select
                value={dispatchStartNode}
                onChange={(e) => setDispatchStartNode(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-400"
              >
                {intersections.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.id} - {n.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="sm:col-span-1 flex justify-center py-1 sm:py-0">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap Start & End points"
                className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-all"
              >
                <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
              </button>
            </div>

            {/* End Point */}
            <div className={`sm:col-span-5 rounded-xl p-2.5 border transition-all ${
              mapPickMode === 'END'
                ? 'bg-rose-950/60 border-rose-400 ring-2 ring-rose-400/30'
                : 'bg-slate-800/70 border-slate-700/70'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>End (Destination)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMapPickMode(mapPickMode === 'END' ? null : 'END')}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono flex items-center space-x-1 border transition-all ${
                    mapPickMode === 'END'
                      ? 'bg-rose-500 text-slate-950 font-bold border-rose-400 animate-pulse'
                      : 'bg-slate-800/80 text-rose-400 border-slate-700 hover:bg-rose-500/20'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{mapPickMode === 'END' ? 'Click Map...' : 'Pick Map'}</span>
                </button>
              </div>
              <select
                value={dispatchTargetNode}
                onChange={(e) => setDispatchTargetNode(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-400"
              >
                {intersections.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.id} - {n.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Vehicle Speed Control (User Requested Option) */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center">3</span>
              <span>Vehicle Speed</span>
            </label>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>{dispatchSpeed} km/h</span>
            </div>
          </div>

          {/* Range Slider */}
          <div className="space-y-1">
            <input 
              type="range"
              min="20"
              max="160"
              step="5"
              value={dispatchSpeed}
              onChange={(e) => setDispatchSpeed(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>20 km/h (Slow)</span>
              <span>55 km/h (Normal)</span>
              <span>85 km/h (Fast)</span>
              <span>160 km/h (Max)</span>
            </div>
          </div>

          {/* Speed Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { label: 'Eco', val: 35 },
              { label: 'Normal', val: 55 },
              { label: 'Fast', val: 85 },
              { label: 'Turbo', val: 130 }
            ].map(p => (
              <button
                type="button"
                key={p.label}
                onClick={() => setDispatchSpeed(p.val)}
                className={`py-1 px-1.5 rounded-lg border text-[10px] font-mono font-medium transition-all text-center ${
                  dispatchSpeed === p.val
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {p.label} ({p.val})
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Algorithm Selection */}
        <div>
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 block flex items-center space-x-1.5">
            <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center">4</span>
            <span>Select Pathfinding Algorithm</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALGORITHMS.map(algo => {
              const isSelected = selectedAlgorithm === algo.id;
              return (
                <div
                  key={algo.id}
                  onClick={() => setSelectedAlgorithm(algo.id)}
                  className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40' 
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{algo.name}</span>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${algo.tagColor}`}>
                      {algo.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{algo.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 5: Dispatch Button */}
        <button
          type="submit"
          disabled={isSubmitting || dispatchStartNode === dispatchTargetNode}
          className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-xl ${
            isSubmitting || dispatchStartNode === dispatchTargetNode
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border border-cyan-300/40 shadow-cyan-500/25 hover:scale-[1.01]'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span>CALCULATING ROUTE & DISPATCHING...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4 text-cyan-200" />
              <span>🚀 START / SEND VEHICLE ({dispatchSpeed} km/h)</span>
            </div>
          )}
        </button>
      </form>

      {/* Live Active Trip Telemetry Card */}
      {activeDispatchedVehicle ? (
        <div className="mt-2 p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 shadow-inner space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-xs font-bold text-white uppercase">
                {activeDispatchedVehicle.name}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                hasArrived 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : activeDispatchedVehicle.status === 'STOPPED_LIGHT'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                {hasArrived ? 'ARRIVED ✅' : activeDispatchedVehicle.status}
              </span>
            </div>

            {/* Live Speed Controls for Moving Car */}
            {!hasArrived && (
              <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  title="Slow down vehicle"
                  onClick={() => changeVehicleSpeed(activeDispatchedVehicle.id, Math.max(20, Math.round(activeDispatchedVehicle.speed - 15)))}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
                >
                  -15
                </button>
                <span className="text-[11px] font-mono font-bold text-cyan-300 min-w-[50px] text-center">
                  {Math.round(activeDispatchedVehicle.speed)} km/h
                </span>
                <button
                  type="button"
                  title="Boost vehicle speed"
                  onClick={() => changeVehicleSpeed(activeDispatchedVehicle.id, Math.min(160, Math.round(activeDispatchedVehicle.speed + 20)))}
                  className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-mono border border-cyan-500/40 font-bold"
                >
                  +20 ⚡
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Route Progress</span>
              <span className={hasArrived ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>
                {tripProgressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${
                  hasArrived 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${tripProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Route path breadcrumbs */}
          {activeRoute && activeRoute.nodeIds?.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                Path: {activeRoute.strategy} ({activeRoute.totalDistance}m)
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {activeRoute.nodeIds.map((nodeId, idx) => {
                  const isCurrent = activeDispatchedVehicle.currentNodeId === nodeId;
                  const isFinal = idx === activeRoute.nodeIds.length - 1;
                  return (
                    <React.Fragment key={nodeId}>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isCurrent 
                          ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/50' 
                          : isFinal 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : idx === 0 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {nodeId}
                      </span>
                      {idx < activeRoute.nodeIds.length - 1 && (
                        <span className="text-slate-600 text-[9px]">➔</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Celebration Arrival Notice */}
          {hasArrived && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-xs font-mono animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Vehicle successfully reached target intersection {dispatchTargetNode}!</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500 font-mono">
          <span>City is empty (0 vehicles). Pick Start & Destination, set speed, and click START.</span>
        </div>
      )}
    </div>
  );
}
