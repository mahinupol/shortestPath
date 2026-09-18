import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { AlertOctagon, RefreshCw, Car, Flame, Route, Zap, ShieldCheck } from 'lucide-react';

export default function TrafficControls() {
  const { 
    cityData, 
    toggleRoadBlock, 
    simulateAccident, 
    simulateRushHour, 
    calculateRoute, 
    activeRoute,
    addToast 
  } = useSimulation();

  const [routeSource, setRouteSource] = useState('N1');
  const [routeTarget, setRouteTarget] = useState('N25');
  const [strategy, setStrategy] = useState('FASTEST');
  const [filterBlocked, setFilterBlocked] = useState(false);

  const handleCalculateTestRoute = async (e) => {
    e.preventDefault();
    if (routeSource === routeTarget) {
      addToast('Source and destination must be different intersections.', 'warning');
      return;
    }
    await calculateRoute(routeSource, routeTarget, strategy, strategy === 'EMERGENCY');
  };

  const roads = cityData?.roads || [];
  const filteredRoads = filterBlocked ? roads.filter(r => r.blocked) : roads;

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Quick Action Incident Triggers */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <h2 className="font-bold text-sm text-white flex items-center space-x-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Traffic & Incident Simulation Controls</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={simulateAccident}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600/90 to-red-700/90 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/20 border border-red-500/40 transition-all"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>SIMULATE ACCIDENT EVENT</span>
          </button>

          <button
            onClick={simulateRushHour}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600/90 to-amber-700/90 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 border border-amber-500/40 transition-all"
          >
            <Car className="w-4 h-4" />
            <span>GENERATE RUSH-HOUR TRAFFIC</span>
          </button>
        </div>
      </div>

      {/* A* Route Strategy Tester Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider mb-3 flex items-center space-x-2">
          <Route className="w-4 h-4 text-cyan-400" />
          <span>A* Pathfinding Strategy Tester</span>
        </h3>

        <form onSubmit={handleCalculateTestRoute} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Start Intersection:</label>
              <select
                value={routeSource}
                onChange={e => setRouteSource(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {cityData?.intersections?.map(n => (
                  <option key={n.id} value={n.id}>{n.id} - {n.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Target Destination:</label>
              <select
                value={routeTarget}
                onChange={e => setRouteTarget(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {cityData?.intersections?.map(n => (
                  <option key={n.id} value={n.id}>{n.id} - {n.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">AOOP Strategy Pattern Contract:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'FASTEST', label: 'Fastest (Traffic-Aware)' },
                { id: 'SHORTEST', label: 'Shortest Distance' },
                { id: 'EMERGENCY', label: 'Emergency Priority' },
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStrategy(s.id)}
                  className={`py-2 px-2 text-[11px] font-mono rounded-lg border transition-all ${
                    strategy === s.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/10"
          >
            EXECUTE A* ALGORITHM
          </button>
        </form>

        {activeRoute && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-xs font-mono">
            <div className="flex justify-between items-center text-cyan-400 font-bold mb-1">
              <span>{activeRoute.strategy}</span>
              <span>{activeRoute.totalDistance} meters</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Path: {activeRoute.nodeIds?.join(' ➔ ')}
            </p>
            <p className="text-emerald-400 text-[10px] mt-1">
              Estimated Travel Time: {activeRoute.estimatedTravelTime}s
            </p>
          </div>
        )}
      </div>

      {/* Road Network & Blocking Registry */}
      <div className="flex-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider">
              Road Network Registry ({roads.length} Segments)
            </h3>
            <span className="text-[10px] text-slate-400">Click toggle to block/unblock roads dynamically</span>
          </div>

          <button
            onClick={() => setFilterBlocked(!filterBlocked)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
              filterBlocked
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {filterBlocked ? 'Show All Roads' : 'Show Blocked Only'}
          </button>
        </div>

        <div className="mt-3 space-y-2 overflow-y-auto flex-1 pr-1 text-xs">
          {filteredRoads.map(road => (
            <div
              key={road.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                road.blocked
                  ? 'bg-red-950/30 border-red-500/40 text-red-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-white">{road.id}</span>
                  <span className="text-slate-400">{road.name}</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                  <span>{road.sourceNodeId} ➔ {road.targetNodeId}</span>
                  <span>{road.distance}m</span>
                  <span style={{ color: road.blocked ? '#ef4444' : road.color }}>
                    {road.blocked ? 'BLOCKED' : road.trafficLevel}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleRoadBlock(road.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  road.blocked
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                }`}
              >
                {road.blocked ? 'RESTORE' : 'BLOCK'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
