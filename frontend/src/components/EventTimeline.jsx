import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Clock, AlertTriangle, Siren, Route, CheckCircle, Zap } from 'lucide-react';

export default function EventTimeline() {
  const { recentEvents } = useSimulation();

  const getEventBadge = (type) => {
    if (type?.includes('EMERGENCY') || type?.includes('ACCIDENT')) {
      return { icon: Siren, color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    }
    if (type?.includes('REROUTE') || type?.includes('BLOCKED')) {
      return { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    if (type?.includes('ROUTE_CALCULATED') || type?.includes('GREEN_WAVE')) {
      return { icon: Route, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
    if (type?.includes('RESOLVED') || type?.includes('RESTORED')) {
      return { icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }
    return { icon: Zap, color: 'text-slate-400 bg-slate-800/40 border-slate-700/40' };
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col h-full overflow-hidden">
      <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
        <Clock className="w-4 h-4 text-cyan-400" />
        <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-white">
          Real-Time Simulation Event Feed
        </h3>
      </div>

      <div className="mt-3 space-y-2.5 overflow-y-auto flex-1 pr-1">
        {(!recentEvents || recentEvents.length === 0) ? (
          <p className="text-xs text-slate-500 text-center py-6">Listening for city events...</p>
        ) : (
          recentEvents.map(evt => {
            const badge = getEventBadge(evt.eventType);
            const Icon = badge.icon;
            const timeStr = evt.timestamp ? new Date(evt.timestamp * 1000).toLocaleTimeString() : 'Now';

            return (
              <div
                key={evt.id || Math.random()}
                className="flex items-start space-x-3 p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/30 transition-all text-xs"
              >
                <div className={`p-1.5 rounded-lg border flex-shrink-0 mt-0.5 ${badge.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                      {evt.eventType?.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{timeStr}</span>
                  </div>
                  <p className="text-slate-200 text-[11px] leading-snug break-words">
                    {evt.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
