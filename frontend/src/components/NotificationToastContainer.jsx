import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function NotificationToastContainer() {
  const { toasts, removeToast } = useSimulation();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let borderClass = 'border-slate-700 bg-slate-900/90 text-slate-200';
        let Icon = Info;
        let iconColor = 'text-cyan-400';

        if (toast.type === 'danger') {
          borderClass = 'border-red-500/50 bg-red-950/90 text-red-100 shadow-red-950/40 shadow-lg';
          Icon = AlertCircle;
          iconColor = 'text-red-400';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/50 bg-amber-950/90 text-amber-100 shadow-amber-950/40 shadow-lg';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (toast.type === 'success') {
          borderClass = 'border-emerald-500/50 bg-emerald-950/90 text-emerald-100 shadow-emerald-950/40 shadow-lg';
          Icon = CheckCircle;
          iconColor = 'text-emerald-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${borderClass}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs">
              <p className="font-semibold leading-snug">{toast.message}</p>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">{toast.time}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
