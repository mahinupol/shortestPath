import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import EmergencyDispatcher from '../components/EmergencyDispatcher';
import SimulationCanvas from '../components/SimulationCanvas';
import { Siren, Clock, CheckCircle2, ShieldAlert, Award, Activity } from 'lucide-react';

export default function EmergencyView() {
  const { cityData, simulationState } = useSimulation();

  const emergencies = cityData?.emergencies || [];
  const resolvedList = emergencies.filter(e => e.status === 'RESOLVED');
  const activeList = emergencies.filter(e => e.status !== 'RESOLVED');

  return (
    <div className="flex flex-col space-y-5">
      {/* Emergency Department Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 backdrop-blur-md">
          <div className="flex items-center justify-between text-red-300 text-xs mb-1 font-mono">
            <span>ACTIVE EMERGENCIES</span>
            <Siren className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <span className="text-3xl font-black font-mono text-red-400">{activeList.length}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>RESOLVED INCIDENTS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-black font-mono text-emerald-400">{resolvedList.length}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>FIRST RESPONDERS</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-3xl font-black font-mono text-cyan-400">{simulationState.emergencyVehicles} Units</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>PRIORITY CORRIDOR</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-bold font-mono text-emerald-300">GREEN PREEMPTION ON</span>
        </div>
      </div>

      {/* Main Grid: Map & Dispatcher */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-[620px]">
        <div className="xl:col-span-7 h-full">
          <SimulationCanvas />
        </div>
        <div className="xl:col-span-5 h-full">
          <EmergencyDispatcher />
        </div>
      </div>

      {/* Incident Log Table */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-white">
            Emergency Incident Audit Log
          </h3>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Emergency ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Incident Call</th>
                <th className="py-2.5 px-3">Origin Depot</th>
                <th className="py-2.5 px-3">Scene Location</th>
                <th className="py-2.5 px-3">Assigned Vehicle</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {emergencies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No emergency incidents logged yet.
                  </td>
                </tr>
              ) : (
                emergencies.map(e => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 font-bold text-cyan-400">{e.id}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.type === 'FIRE' ? 'bg-orange-500/20 text-orange-400' : (e.type === 'POLICE' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400')
                      }`}>
                        {e.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-200">{e.title}</td>
                    <td className="py-2 px-3">{e.sourceNodeId}</td>
                    <td className="py-2 px-3 text-amber-400 font-bold">{e.targetNodeId}</td>
                    <td className="py-2 px-3 text-cyan-300">{e.assignedVehicleId || 'Auto Dispatch'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        e.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400 animate-pulse'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
