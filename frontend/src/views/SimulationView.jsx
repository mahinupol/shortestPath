import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import SimulationCanvas from '../components/SimulationCanvas';
import VehicleInspectorModal from '../components/VehicleInspectorModal';
import RoadInspectorModal from '../components/RoadInspectorModal';
import { Car, Route, Plus, Filter, Navigation, Gauge } from 'lucide-react';
import { api } from '../api/client';

export default function SimulationView() {
  const { 
    cityData, 
    selectedVehicle, 
    setSelectedVehicle, 
    selectedRoad, 
    setSelectedRoad, 
    setSelectedNode, 
    refreshCityData,
    addToast,
    setActiveTab 
  } = useSimulation();

  const [activeRosterTab, setActiveRosterTab] = useState('vehicles'); // 'vehicles' or 'roads'
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [spawnType, setSpawnType] = useState('CAR');
  const [spawnStartNode, setSpawnStartNode] = useState('N1');
  const [spawnTargetNode, setSpawnTargetNode] = useState('N25');
  const [isSpawning, setIsSpawning] = useState(false);

  const handleSpawn = async (e) => {
    e.preventDefault();
    setIsSpawning(true);
    try {
      await api.spawnVehicle(spawnType, spawnStartNode, spawnTargetNode);
      addToast(`Spawned new ${spawnType} at ${spawnStartNode}!`, 'success');
      await refreshCityData();
    } catch (err) {
      addToast(err.message, 'danger');
    } finally {
      setIsSpawning(false);
    }
  };

  const vehicles = cityData?.vehicles || [];
  const roads = cityData?.roads || [];

  const filteredVehicles = vehicles.filter(v => {
    if (vehicleFilter === 'ALL') return true;
    return v.type === vehicleFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[640px]">
      {/* Simulation Map Area */}
      <div className="lg:col-span-8 h-full">
        <SimulationCanvas 
          onSelectNode={(node) => setSelectedNode(node)}
          onSelectRoad={(road) => { setSelectedRoad(road); setSelectedVehicle(null); }}
          onSelectVehicle={(veh) => { setSelectedVehicle(veh); setSelectedRoad(null); }}
        />
      </div>

      {/* Side Roster & Spawn Controls */}
      <div className="lg:col-span-4 h-full flex flex-col space-y-4 overflow-hidden">
        {/* Real Map Navigator Quick Banner */}
        <div 
          onClick={() => setActiveTab('realmap')}
          className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 hover:border-cyan-400 cursor-pointer transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-between group"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-mono flex items-center space-x-1.5">
                <span>Real Map Navigator</span>
                <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300">Mapbox</span>
              </h4>
              <p className="text-[10px] text-slate-400">Draw rectangles to navigate real streets</p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 group-hover:translate-x-1 transition-transform">➔</span>
        </div>

        {/* Spawn Vehicle Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-white flex items-center space-x-2 mb-2.5">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Spawn Autonomous Vehicle</span>
          </h3>

          <form onSubmit={handleSpawn} className="space-y-2.5 text-xs">
            <div className="grid grid-cols-3 gap-2">
              {['CAR', 'AMBULANCE', 'FIRE_TRUCK', 'POLICE'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSpawnType(t)}
                  className={`py-1.5 px-2 rounded-lg border font-mono text-[10px] font-bold transition-all ${
                    spawnType === t
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Start Node:</label>
                <select
                  value={spawnStartNode}
                  onChange={e => setSpawnStartNode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono"
                >
                  {cityData?.intersections?.map(n => (
                    <option key={n.id} value={n.id}>{n.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Node:</label>
                <select
                  value={spawnTargetNode}
                  onChange={e => setSpawnTargetNode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono"
                >
                  {cityData?.intersections?.map(n => (
                    <option key={n.id} value={n.id}>{n.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSpawning}
              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors"
            >
              {isSpawning ? 'SPAWNING...' : 'DEPLOY VEHICLE TO GRID'}
            </button>
          </form>
        </div>

        {/* Roster Table Card */}
        <div className="flex-1 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveRosterTab('vehicles')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeRosterTab === 'vehicles' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Vehicles ({vehicles.length})
              </button>
              <button
                onClick={() => setActiveRosterTab('roads')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeRosterTab === 'roads' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Roads ({roads.length})
              </button>
            </div>

            {activeRosterTab === 'vehicles' && (
              <select
                value={vehicleFilter}
                onChange={e => setVehicleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] text-slate-300 font-mono"
              >
                <option value="ALL">All Types</option>
                <option value="CAR">Civilian Cars</option>
                <option value="AMBULANCE">Ambulances</option>
                <option value="FIRE_TRUCK">Fire Trucks</option>
                <option value="POLICE">Police</option>
              </select>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 text-xs">
            {activeRosterTab === 'vehicles' ? (
              filteredVehicles.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedVehicle?.id === v.id
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-[11px] text-cyan-400">{v.id}</span>
                    <span className="text-slate-200">{v.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-[10px]">
                    <span className="text-slate-400">{v.speed} km/h</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{v.status}</span>
                  </div>
                </div>
              ))
            ) : (
              roads.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoad(r)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedRoad?.id === r.id
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-[11px] text-white block">{r.id} - {r.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{r.sourceNodeId} ➔ {r.targetNodeId} ({r.distance}m)</span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                    style={{ color: r.blocked ? '#ef4444' : r.color }}
                  >
                    {r.blocked ? 'BLOCKED' : r.trafficLevel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inspector Modals */}
      {selectedVehicle && (
        <VehicleInspectorModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      )}
      {selectedRoad && (
        <RoadInspectorModal road={selectedRoad} onClose={() => setSelectedRoad(null)} />
      )}
    </div>
  );
}
