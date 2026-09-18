import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const [cityData, setCityData] = useState(null);
  const [simulationState, setSimulationState] = useState({
    running: true,
    paused: false,
    speedMultiplier: 1.0,
    tickCount: 0,
    formattedSimTime: '08:00:00',
    totalVehicles: 0,
    activeVehicles: 0,
    emergencyVehicles: 0,
    activeEmergencies: 0,
    blockedRoadsCount: 0,
    averageSpeed: 0,
    averageTrafficLevel: 'LOW',
    totalReroutes: 0,
  });

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'simulation', 'emergency', 'traffic', 'analytics', 'about'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null); // Highlighted A* path: { nodeIds, edgeIds, totalDistance, travelTime, strategy }
  const [activeDispatchedVehicleId, setActiveDispatchedVehicleId] = useState(null);

  // Map Click Interactive Picking for Start & End points
  const [mapPickMode, setMapPickMode] = useState(null); // 'START' | 'END' | null
  const [dispatchStartNode, setDispatchStartNode] = useState('N1');
  const [dispatchTargetNode, setDispatchTargetNode] = useState('N25');
  const [dispatchSpeed, setDispatchSpeed] = useState(60); // Selected Car Speed in km/h

  const [toasts, setToasts] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);

  const prevEventCountRef = useRef(0);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, message, type, time: new Date().toLocaleTimeString() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch full city snapshot
  const refreshCityData = useCallback(async () => {
    try {
      const data = await api.getCityData();
      setCityData(data);
      if (data.simulationState) {
        setSimulationState(data.simulationState);
      }
      setBackendError(null);
      setLoading(false);
    } catch (err) {
      setBackendError(err.message);
      setLoading(false);
    }
  }, []);

  // Fetch recent events for timeline
  const refreshEvents = useCallback(async () => {
    try {
      const analytics = await api.getAnalytics();
      if (analytics.recentEvents) {
        setRecentEvents(analytics.recentEvents);
        // Show toast for newest event if newly arrived
        if (analytics.recentEvents.length > prevEventCountRef.current && prevEventCountRef.current > 0) {
          const newest = analytics.recentEvents[0];
          let toastType = 'info';
          if (newest.eventType.includes('EMERGENCY') || newest.eventType.includes('ACCIDENT')) {
            toastType = 'danger';
          } else if (newest.eventType.includes('REROUTE')) {
            toastType = 'warning';
          } else if (newest.eventType.includes('RESOLVED')) {
            toastType = 'success';
          }
          addToast(newest.message, toastType);
        }
        prevEventCountRef.current = analytics.recentEvents.length;
      }
    } catch (err) {
      // Background poll silently handles momentary lag
    }
  }, [addToast]);

  // Polling loop (every 750ms for smooth simulation state synchrony)
  useEffect(() => {
    refreshCityData();
    refreshEvents();

    const interval = setInterval(() => {
      refreshCityData();
      refreshEvents();
    }, 800);

    return () => clearInterval(interval);
  }, [refreshCityData, refreshEvents]);

  // Simulation Controls
  const toggleStartPause = async () => {
    try {
      if (simulationState.paused) {
        const state = await api.resumeSimulation();
        setSimulationState(state);
        addToast('Simulation resumed', 'success');
      } else {
        const state = await api.pauseSimulation();
        setSimulationState(state);
        addToast('Simulation paused', 'info');
      }
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  const resetSimulation = async () => {
    try {
      const state = await api.resetSimulation();
      setSimulationState(state);
      setActiveRoute(null);
      setSelectedVehicle(null);
      setSelectedRoad(null);
      addToast('City simulation reset to initial state', 'warning');
      await refreshCityData();
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  const setSpeedMultiplier = async (speed) => {
    try {
      const state = await api.setSpeed(speed);
      setSimulationState(state);
      addToast(`Simulation speed set to ${speed}x`, 'info');
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  const manualStep = async () => {
    try {
      const state = await api.triggerTick();
      setSimulationState(state);
      await refreshCityData();
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  // Road Actions
  const toggleRoadBlock = async (roadId) => {
    try {
      const road = cityData?.roads?.find(r => r.id === roadId || r.id === roadId + '_fwd');
      if (road?.blocked) {
        await api.restoreRoad(roadId);
        addToast(`Road ${roadId} restored to normal traffic.`, 'success');
      } else {
        await api.blockRoad(roadId);
        addToast(`Road ${roadId} BLOCKED. Automatic vehicle rerouting triggered.`, 'warning');
      }
      await refreshCityData();
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  const simulateAccident = async () => {
    try {
      const road = await api.simulateAccident();
      addToast(`Accident simulated on ${road.name}! Route recalculation active.`, 'danger');
      await refreshCityData();
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  const simulateRushHour = async () => {
    try {
      await api.simulateRushHour();
      addToast(`Rush hour congestion initiated across city sectors.`, 'warning');
      await refreshCityData();
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  // Emergency Actions
  const dispatchEmergency = async (request) => {
    try {
      const emergency = await api.dispatchEmergency(request);
      addToast(`EMERGENCY: ${emergency.title} dispatched! A* priority corridor active.`, 'danger');
      await refreshCityData();
      return emergency;
    } catch (err) {
      addToast(err.message, 'danger');
      throw err;
    }
  };

  const resolveEmergency = async (id) => {
    try {
      const resolved = await api.resolveEmergency(id);
      addToast(`Emergency ${resolved.title} resolved.`, 'success');
      await refreshCityData();
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  // Route Calculation
  const calculateRoute = async (sourceId, targetId, strategy = 'FASTEST', isEmergency = false) => {
    try {
      const result = await api.calculateRoute(sourceId, targetId, strategy, isEmergency);
      if (result.found) {
        setActiveRoute(result);
        addToast(`A* path calculated: ${result.totalDistance}m (${result.estimatedTravelTime}s)`, 'success');
      } else {
        addToast(result.message || 'No available path found.', 'danger');
      }
      return result;
    } catch (err) {
      addToast(err.message, 'danger');
      throw err;
    }
  };

  // Vehicle Deploy & Clear Actions (User Requested Workflow)
  const deployVehicle = async ({ type, startNodeId, targetNodeId, algorithm, speed }) => {
    try {
      const vSpeed = speed || dispatchSpeed || 60;
      const response = await api.deployVehicle({ type, startNodeId, targetNodeId, algorithm, speed: vSpeed });
      if (response?.vehicle) {
        setActiveDispatchedVehicleId(response.vehicle.id);
        setSelectedVehicle(response.vehicle);
      }
      if (response?.route && response.route.found) {
        setActiveRoute(response.route);
        addToast(`🚗 ${response.vehicle.name} (${vSpeed} km/h) dispatched via ${response.route.strategy} (${response.route.totalDistance}m)!`, 'success');
      } else {
        addToast(`Vehicle spawned at ${startNodeId}, but no route found to ${targetNodeId}`, 'warning');
      }
      await refreshCityData();
      return response;
    } catch (err) {
      addToast(err.message, 'danger');
      throw err;
    }
  };

  const changeVehicleSpeed = async (vehicleId, newSpeed) => {
    try {
      const updated = await api.updateVehicleSpeed(vehicleId, newSpeed);
      addToast(`⚡ Speed updated to ${newSpeed} km/h!`, 'info');
      await refreshCityData();
      return updated;
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  const clearAllVehicles = async () => {
    try {
      await api.clearVehicles();
      setActiveDispatchedVehicleId(null);
      setSelectedVehicle(null);
      setActiveRoute(null);
      addToast('All vehicles cleared from the city map.', 'info');
      await refreshCityData();
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  // Handle node selection from 2D or 3D map click
  const handleMapNodeSelect = (node) => {
    if (!node) return;
    setSelectedNode(node);
    if (mapPickMode === 'START') {
      setDispatchStartNode(node.id);
      setMapPickMode('END'); // Seamlessly prompt user to pick destination next
      addToast(`🟢 Start Point set to ${node.id} (${node.name || 'Intersection'}). Now click Destination on map!`, 'success');
    } else if (mapPickMode === 'END') {
      setDispatchTargetNode(node.id);
      setMapPickMode(null); // Finished picking
      addToast(`🔴 Destination set to ${node.id} (${node.name || 'Intersection'})! Ready to start.`, 'success');
    } else {
      addToast(`Selected ${node.id}: ${node.name || 'Intersection'}`, 'info');
    }
  };

  // Find the currently tracked active dispatched vehicle
  const activeDispatchedVehicle = cityData?.vehicles?.find(v => v.id === activeDispatchedVehicleId) || null;

  return (
    <SimulationContext.Provider
      value={{
        cityData,
        simulationState,
        activeTab,
        setActiveTab,
        selectedVehicle,
        setSelectedVehicle,
        selectedRoad,
        setSelectedRoad,
        selectedNode,
        setSelectedNode,
        activeRoute,
        setActiveRoute,
        activeDispatchedVehicleId,
        activeDispatchedVehicle,
        mapPickMode,
        setMapPickMode,
        dispatchStartNode,
        setDispatchStartNode,
        dispatchTargetNode,
        setDispatchTargetNode,
        dispatchSpeed,
        setDispatchSpeed,
        changeVehicleSpeed,
        handleMapNodeSelect,
        deployVehicle,
        clearAllVehicles,
        toasts,
        addToast,
        removeToast,
        recentEvents,
        loading,
        backendError,
        refreshCityData,
        toggleStartPause,
        resetSimulation,
        setSpeedMultiplier,
        manualStep,
        toggleRoadBlock,
        simulateAccident,
        simulateRushHour,
        dispatchEmergency,
        resolveEmergency,
        calculateRoute,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
