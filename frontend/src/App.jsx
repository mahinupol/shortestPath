import React from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import TopNavbar from './components/TopNavbar';
import NotificationToastContainer from './components/NotificationToastContainer';
import DashboardView from './views/DashboardView';
import RealMapView from './views/RealMapView';
import SimulationView from './views/SimulationView';
import EmergencyView from './views/EmergencyView';
import TrafficView from './views/TrafficView';
import AnalyticsView from './views/AnalyticsView';
import AboutAOOPView from './views/AboutAOOPView';
import { AlertCircle, RefreshCw } from 'lucide-react';

function MainContent() {
  const { activeTab, loading, backendError, refreshCityData } = useSimulation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <div className="absolute w-8 h-8 rounded-full bg-cyan-500/10 animate-pulse" />
        </div>
        <p className="font-mono text-sm text-cyan-400 tracking-wider">CONNECTING TO SMART CITY BACKEND...</p>
        <p className="text-xs text-slate-500">Initializing city graph, traffic lights, and vehicle fleets</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col">
      <TopNavbar />

      {/* Backend connection warning banner if offline */}
      {backendError && (
        <div className="bg-red-950/80 border-b border-red-500/40 px-4 py-2.5 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>
              Backend Connection Warning: Could not reach Spring Boot API on port 8080. ({backendError})
            </span>
          </div>
          <button
            onClick={refreshCityData}
            className="px-2.5 py-1 rounded bg-red-800/60 hover:bg-red-700/80 font-mono text-[11px] flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1700px] w-full mx-auto">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'realmap' && <RealMapView />}
        {activeTab === 'simulation' && <SimulationView />}
        {activeTab === 'emergency' && <EmergencyView />}
        {activeTab === 'traffic' && <TrafficView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'about' && <AboutAOOPView />}
      </main>

      {/* Floating Notification Alerts */}
      <NotificationToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <SimulationProvider>
      <MainContent />
    </SimulationProvider>
  );
}
