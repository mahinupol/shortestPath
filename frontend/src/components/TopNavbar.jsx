import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  Activity, 
  Clock, 
  Siren, 
  AlertTriangle, 
  Zap, 
  Car, 
  BarChart2, 
  BookOpen,
  MapPin
} from 'lucide-react';

export default function TopNavbar() {
  const { 
    simulationState, 
    toggleStartPause, 
    resetSimulation, 
    setSpeedMultiplier, 
    manualStep,
    activeTab, 
    setActiveTab,
    backendError 
  } = useSimulation();

  const tabs = [
    { id: 'dashboard', label: 'Command Center', icon: Activity },
    { id: 'simulation', label: 'Simulation Grid', icon: Car },
    { id: 'emergency', label: 'Emergency Matrix', icon: Siren },
    { id: 'traffic', label: 'Traffic & Bottlenecks', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics & Telemetry', icon: BarChart2 },
    { id: 'about', label: 'AOOP Architecture', icon: BookOpen },
  ];

  const speeds = [0.5, 1.0, 2.0, 5.0, 10.0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070b14]/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Brand & System Status */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
              <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 ring-2 ring-[#070b14] animate-ping" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold tracking-wider text-white uppercase font-mono">
                  Smart<span className="text-cyan-400">City</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  AOOP Sim
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight">Autonomous Traffic & Emergency Hub</p>
            </div>
          </div>

          {/* System Status Pill */}
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${backendError ? 'bg-red-500 animate-ping' : simulationState.paused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="font-mono text-slate-300">
              {backendError ? 'BACKEND OFFLINE' : simulationState.paused ? 'SIMULATION PAUSED' : 'SYSTEM ONLINE'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden xl:flex items-center space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/5' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'emergency' && simulationState.activeEmergencies > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                    {simulationState.activeEmergencies}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Time, Speed & Simulation Controls */}
        <div className="flex items-center space-x-3">
          {/* Simulation Clock */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{simulationState.formattedSimTime || '08:00:00'}</span>
          </div>

          {/* Speed Controls */}
          <div className="hidden lg:flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {speeds.map(spd => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  simulationState.speedMultiplier === spd
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Start / Pause Toggle */}
          <button
            onClick={toggleStartPause}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-all duration-200 ${
              simulationState.paused
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {simulationState.paused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            <span>{simulationState.paused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          {/* Step Button */}
          <button
            onClick={manualStep}
            title="Advance one simulation tick"
            className="hidden sm:block p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            <StepForward className="w-4 h-4" />
          </button>

          {/* Reset Button */}
          <button
            onClick={resetSimulation}
            title="Reset Simulation State"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-300 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Sub-Navigation Bar with Smooth Horizontal Touch Scrolling */}
      <div className="flex xl:hidden overflow-x-auto border-t border-slate-800/60 bg-[#090e1b] px-3 py-2 space-x-1.5 scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
