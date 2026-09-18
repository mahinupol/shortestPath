import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import TrafficControls from '../components/TrafficControls';
import SimulationCanvas from '../components/SimulationCanvas';
import VehicleInspectorModal from '../components/VehicleInspectorModal';
import RoadInspectorModal from '../components/RoadInspectorModal';

export default function TrafficView() {
  const { 
    selectedVehicle, 
    setSelectedVehicle, 
    selectedRoad, 
    setSelectedRoad, 
    setSelectedNode 
  } = useSimulation();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[640px]">
      {/* Simulation Map Area */}
      <div className="xl:col-span-7 h-full">
        <SimulationCanvas 
          onSelectNode={(node) => setSelectedNode(node)}
          onSelectRoad={(road) => { setSelectedRoad(road); setSelectedVehicle(null); }}
          onSelectVehicle={(veh) => { setSelectedVehicle(veh); setSelectedRoad(null); }}
        />
      </div>

      {/* Traffic Controls & Network Blocking Registry */}
      <div className="xl:col-span-5 h-full">
        <TrafficControls />
      </div>

      {/* Modals */}
      {selectedVehicle && (
        <VehicleInspectorModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      )}
      {selectedRoad && (
        <RoadInspectorModal road={selectedRoad} onClose={() => setSelectedRoad(null)} />
      )}
    </div>
  );
}
