import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Car, 
  Siren, 
  Activity,
  Gauge
} from 'lucide-react';

export default function AnalyticsView() {
  const { simulationState } = useSimulation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 1500);
    return () => clearInterval(interval);
  }, []);

  const trafficDist = analytics?.trafficDistribution || { LOW: 30, MEDIUM: 10, HIGH: 5, CRITICAL: 3 };
  const vehicleDist = analytics?.vehicleTypeDistribution || { CAR: 21, AMBULANCE: 4, FIRE_TRUCK: 3, POLICE: 4 };

  const totalRoads = Object.values(trafficDist).reduce((a, b) => a + b, 0) + (analytics?.blockedRoadsCount || 0);

  return (
    <div className="flex flex-col space-y-6">
      {/* Analytics KPI Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>AVG RESPONSE TIME</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black font-mono text-cyan-300">
              {analytics?.averageResponseTimeSeconds || 38.5}s
            </span>
            <span className="text-xs text-emerald-400 font-mono">Optimal</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>RESOLVED INCIDENTS</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black font-mono text-emerald-400">
              {analytics?.resolvedEmergencies || 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">Completed</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>DYNAMIC REROUTES</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black font-mono text-amber-400">
              {analytics?.totalReroutesTriggered || simulationState.totalReroutes}
            </span>
            <span className="text-xs text-slate-400 font-mono">A* Recalcs</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>AVERAGE VELOCITY</span>
            <Gauge className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black font-mono text-purple-300">
              {analytics?.averageSpeedKmh || simulationState.averageSpeed}
            </span>
            <span className="text-xs text-slate-400 font-mono">km/h</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Road Congestion Distribution Bar Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Road Congestion Distribution</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">{totalRoads} Monitored Segments</span>
          </div>

          <div className="space-y-4 mt-5">
            {[
              { label: 'Low Congestion (Cost x1)', count: trafficDist.LOW || 0, color: 'bg-emerald-500', text: 'text-emerald-400' },
              { label: 'Medium Congestion (Cost x2)', count: trafficDist.MEDIUM || 0, color: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'High Congestion (Cost x4)', count: trafficDist.HIGH || 0, color: 'bg-orange-500', text: 'text-orange-400' },
              { label: 'Critical Bottleneck (Cost x8)', count: trafficDist.CRITICAL || 0, color: 'bg-red-500', text: 'text-red-400' },
              { label: 'Blocked / Closed (Hazard)', count: analytics?.blockedRoadsCount || 0, color: 'bg-red-700', text: 'text-red-300' },
            ].map(item => {
              const pct = totalRoads > 0 ? Math.round((item.count / totalRoads) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">{item.label}</span>
                    <span className={`font-bold ${item.text}`}>{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicle Fleet Composition Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-white flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <span>Fleet Classification & Active Roles</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">{analytics?.totalVehicles || 32} Total Units</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            {[
              { type: 'Civilian Cars', count: vehicleDist.CAR || 21, icon: Car, color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300', priority: 'Priority 1' },
              { type: 'Ambulances', count: vehicleDist.AMBULANCE || 4, icon: Siren, color: 'border-red-500/30 bg-red-500/10 text-red-300', priority: 'Priority 9' },
              { type: 'Fire Trucks', count: vehicleDist.FIRE_TRUCK || 3, icon: AlertTriangle, color: 'border-orange-500/30 bg-orange-500/10 text-orange-300', priority: 'Priority 10' },
              { type: 'Police Patrols', count: vehicleDist.POLICE || 4, icon: Activity, color: 'border-blue-500/30 bg-blue-500/10 text-blue-300', priority: 'Priority 8' },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.type} className={`p-4 rounded-xl border ${f.color} flex items-center space-x-3`}>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{f.type}</h4>
                    <div className="flex items-baseline space-x-1.5 font-mono">
                      <span className="text-xl font-extrabold">{f.count}</span>
                      <span className="text-[10px] text-slate-400">{f.priority}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 font-mono">
            <span className="text-cyan-400 font-bold block mb-1">Priority Preemption Algorithm:</span>
            Emergency vehicles take precedence at intersections, forcing signal transitions to Green and bypassing standard congestion penalties.
          </div>
        </div>
      </div>
    </div>
  );
}
