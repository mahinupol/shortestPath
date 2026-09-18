import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSimulation } from '../context/SimulationContext';
import SimulationCanvas3D from './SimulationCanvas3D';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Compass, 
  Layers, 
  Eye, 
  Navigation,
  Crosshair,
  Box
} from 'lucide-react';

export default function SimulationCanvas({ onSelectNode, onSelectRoad, onSelectVehicle }) {
  const [is3DMode, setIs3DMode] = useState(true);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const { 
    cityData, 
    simulationState, 
    activeRoute, 
    selectedVehicle, 
    selectedRoad, 
    selectedNode 
  } = useSimulation();

  // Camera transform state (Pan and Zoom)
  const [camera, setCamera] = useState({ x: 40, y: 30, scale: 0.95 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredElement, setHoveredElement] = useState(null);
  const [showTrafficHeatmap, setShowTrafficHeatmap] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);

  // Local vehicle positions for 60fps smooth interpolation
  const vehiclePositionsRef = useRef(new Map());
  const animFrameRef = useRef(null);
  const pulsePhaseRef = useRef(0);

  // Update vehicle targets whenever cityData refreshes
  useEffect(() => {
    if (!cityData?.vehicles) return;
    const now = performance.now();
    cityData.vehicles.forEach(v => {
      const prev = vehiclePositionsRef.current.get(v.id);
      if (prev) {
        prev.startX = prev.currentX;
        prev.startY = prev.currentY;
        prev.targetX = v.x;
        prev.targetY = v.y;
        prev.startTime = now;
        prev.type = v.type;
        prev.speed = v.speed;
        prev.status = v.status;
        prev.priority = v.priority;
        prev.roadProgress = v.roadProgress;
        prev.routeNodeIds = v.routeNodeIds;
      } else {
        vehiclePositionsRef.current.set(v.id, {
          currentX: v.x,
          currentY: v.y,
          startX: v.x,
          startY: v.y,
          targetX: v.x,
          targetY: v.y,
          startTime: now,
          type: v.type,
          speed: v.speed,
          status: v.status,
          priority: v.priority,
          roadProgress: v.roadProgress,
          routeNodeIds: v.routeNodeIds
        });
      }
    });

    // Clean up vehicles that were removed
    const currentIds = new Set(cityData.vehicles.map(v => v.id));
    for (let id of vehiclePositionsRef.current.keys()) {
      if (!currentIds.has(id)) {
        vehiclePositionsRef.current.delete(id);
      }
    }
  }, [cityData]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let isSubscribed = true;

    const render = (time) => {
      if (!isSubscribed) return;

      pulsePhaseRef.current = (time / 1000) % (Math.PI * 2);

      // Handle high DPI displays
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Apply Camera Pan and Zoom
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.scale, camera.scale);

      // 1. Draw City Grid & Ambient District Zones
      drawDistrictBackgrounds(ctx);
      drawGridGridlines(ctx);

      // 2. Draw Roads
      if (cityData?.roads && cityData?.intersections) {
        drawRoads(ctx, cityData.roads, cityData.intersections, showTrafficHeatmap);
      }

      // 3. Draw Active A* Route Highlights
      if (activeRoute && activeRoute.nodeIds && cityData?.intersections) {
        drawActiveRoute(ctx, activeRoute, cityData.intersections);
      }

      // 4. Draw Intersections & Traffic Lights
      if (cityData?.intersections) {
        drawIntersections(ctx, cityData.intersections, showLandmarks);
      }

      // 5. Draw Animated Vehicles
      drawVehicles(ctx, time);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cityData, camera, activeRoute, showTrafficHeatmap, showLandmarks, selectedVehicle, selectedRoad, selectedNode]);

  // Helper Drawing Functions
  const drawDistrictBackgrounds = (ctx) => {
    // Subtle cyber grid backdrop
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, 1050, 850);

    // Glowing district sectors
    const districts = [
      { x: 50, y: 50, w: 450, h: 320, color: 'rgba(0, 240, 255, 0.03)', label: 'NORTH SECTOR & TECH PARK' },
      { x: 550, y: 50, w: 450, h: 320, color: 'rgba(168, 85, 247, 0.03)', label: 'CIVIC & COMMERCIAL CORE' },
      { x: 50, y: 430, w: 450, h: 370, color: 'rgba(245, 158, 11, 0.03)', label: 'FINANCIAL & INDUSTRIAL ZONE' },
      { x: 550, y: 430, w: 450, h: 370, color: 'rgba(16, 185, 129, 0.03)', label: 'RESIDENTIAL & HARBOR COMMONS' },
    ];

    districts.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.strokeRect(d.x, d.y, d.w, d.h);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(d.label, d.x + 16, d.y + 24);
    });
  };

  const drawGridGridlines = (ctx) => {
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 0.5;
    const step = 50;
    for (let x = 0; x <= 1050; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 850);
      ctx.stroke();
    }
    for (let y = 0; y <= 850; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1050, y);
      ctx.stroke();
    }
  };

  const drawRoads = (ctx, roads, intersections, heatmap) => {
    const nodeMap = new Map(intersections.map(n => [n.id, n]));

    // Draw unique road lines (avoid double drawing fwd and rev on top of each other)
    const drawnPairs = new Set();

    roads.forEach(road => {
      const pairKey = [road.sourceNodeId, road.targetNodeId].sort().join('--');
      if (drawnPairs.has(pairKey)) return;
      drawnPairs.add(pairKey);

      const u = nodeMap.get(road.sourceNodeId);
      const v = nodeMap.get(road.targetNodeId);
      if (!u || !v) return;

      const isSelected = selectedRoad?.id === road.id || selectedRoad?.id?.startsWith(road.id);

      // 1. Asphalt Base Road Ribbon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(u.x, u.y);
      ctx.lineTo(v.x, v.y);
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#121929';
      ctx.stroke();

      // Road border casing
      ctx.lineWidth = 20;
      ctx.strokeStyle = isSelected ? '#00f0ff' : 'rgba(30, 41, 59, 0.8)';
      ctx.stroke();

      // 2. Traffic Flow Color Strip / Hazard Stripes for Blocked Roads
      if (road.blocked) {
        // Blocked Road Hazard Stripe Pattern
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([12, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Red Road Blocked Badge in the middle of road
        const midX = (u.x + v.x) / 2;
        const midY = (u.y + v.y) / 2;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(midX, midY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛔', midX, midY);
      } else if (heatmap) {
        // Traffic Level Color
        let glowColor = 'rgba(16, 185, 129, 0.5)'; // Low (Green)
        if (road.trafficLevel === 'MEDIUM') glowColor = 'rgba(245, 158, 11, 0.6)'; // Medium (Yellow)
        else if (road.trafficLevel === 'HIGH') glowColor = 'rgba(249, 115, 22, 0.7)'; // High (Orange)
        else if (road.trafficLevel === 'CRITICAL') glowColor = 'rgba(239, 68, 68, 0.85)'; // Critical (Red)

        ctx.lineWidth = 3;
        ctx.strokeStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = road.trafficLevel === 'CRITICAL' ? 12 : 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Dashed Center Divider
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 8]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    });
  };

  const drawActiveRoute = (ctx, route, intersections) => {
    const nodeMap = new Map(intersections.map(n => [n.id, n]));
    const isEmergency = route.strategy?.toLowerCase().includes('emergency');

    ctx.save();
    ctx.beginPath();

    let started = false;
    route.nodeIds.forEach(nodeId => {
      const node = nodeMap.get(nodeId);
      if (node) {
        if (!started) {
          ctx.moveTo(node.x, node.y);
          started = true;
        } else {
          ctx.lineTo(node.x, node.y);
        }
      }
    });

    // Glowing Neon Beam
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEmergency) {
      // Pulsing Emergency Red-Orange Priority Beam
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.85)';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 18 + Math.sin(pulsePhaseRef.current * 2) * 6;
      ctx.stroke();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    } else {
      // Cyan Normal A* Beam
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawIntersections = (ctx, intersections, showLandmarks) => {
    intersections.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const isHospital = node.type === 'HOSPITAL';
      const isFire = node.type === 'FIRE_STATION';
      const isPolice = node.type === 'POLICE_STATION';
      const isSpecial = isHospital || isFire || isPolice || node.type !== 'INTERSECTION';

      ctx.save();

      // Outer Halo for Traffic Light
      let haloColor = 'rgba(34, 197, 94, 0.6)'; // Green
      if (node.trafficLightState === 'YELLOW') haloColor = 'rgba(234, 179, 8, 0.7)';
      if (node.trafficLightState === 'RED') haloColor = 'rgba(239, 68, 68, 0.7)';

      if (node.emergencyOverride) {
        haloColor = 'rgba(0, 240, 255, 0.9)'; // Emergency Green Corridor override
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, isSpecial ? 18 : 12, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = isSelected ? '#00f0ff' : haloColor;
      ctx.shadowColor = haloColor;
      ctx.shadowBlur = node.emergencyOverride ? 16 : 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner Symbol or Traffic Light Pip
      if (isHospital) {
        // Red Cross
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(node.x - 2, node.y - 7, 4, 14);
        ctx.fillRect(node.x - 7, node.y - 2, 14, 4);
      } else if (isFire) {
        // Flame indicator
        ctx.fillStyle = '#f97316';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚒', node.x, node.y);
      } else if (isPolice) {
        // Police badge
        ctx.fillStyle = '#3b82f6';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚔', node.x, node.y);
      } else {
        // Center Signal Dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = haloColor;
        ctx.fill();
      }

      // Labels
      if (showLandmarks) {
        ctx.font = isSpecial ? 'bold 10px Inter, sans-serif' : '9px JetBrains Mono, monospace';
        ctx.fillStyle = isSpecial ? '#f8fafc' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.split(' (')[0], node.x, node.y + (isSpecial ? 28 : 20));
      }

      ctx.restore();
    });
  };

  const drawVehicles = (ctx, time) => {
    const positions = vehiclePositionsRef.current;
    const now = performance.now();

    positions.forEach((vPos, id) => {
      // 60fps Smooth interpolation between target ticks
      const elapsed = (now - vPos.startTime) / 1000;
      const t = Math.min(1.0, elapsed / 0.85); // Interpolate over 850ms interval

      const curX = vPos.startX + (vPos.targetX - vPos.startX) * t;
      const curY = vPos.startY + (vPos.targetY - vPos.startY) * t;
      vPos.currentX = curX;
      vPos.currentY = curY;

      const isSelected = selectedVehicle?.id === id;
      const isEmergency = vPos.type === 'AMBULANCE' || vPos.type === 'FIRE_TRUCK' || vPos.type === 'POLICE';

      // Compute heading angle for directional drawing
      const dx = vPos.targetX - vPos.startX;
      const dy = vPos.targetY - vPos.startY;
      const angle = (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) ? Math.atan2(dy, dx) : 0;

      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(angle);

      if (isEmergency) {
        // Flashing Emergency Strobe Beacon Effect
        const flashPhase = Math.sin(time / 80);
        const strobeColor = flashPhase > 0 ? '#ef4444' : '#3b82f6';

        ctx.shadowColor = strobeColor;
        ctx.shadowBlur = 14;

        if (vPos.type === 'AMBULANCE') {
          // Ambulance Body: White with Red medical stripes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-10, -5, 20, 10);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-3, -5, 6, 10);
          // Flashing top beacon
          ctx.fillStyle = strobeColor;
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (vPos.type === 'FIRE_TRUCK') {
          // Fire Truck Body: Bold Crimson
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-13, -6, 26, 12);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(-8, -2, 16, 4);
          // Rotating amber beacon
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(2, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (vPos.type === 'POLICE') {
          // Police Cruiser: Black and White Interceptor
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-10, -5, 20, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-3, -5, 6, 10);
          // Red & Blue Alternating Lightbar
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-1, -4, 2, 3);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(-1, 1, 2, 3);
        }
      } else {
        // Civilian Car Body
        ctx.fillStyle = isSelected ? '#00f0ff' : '#0284c7';
        ctx.shadowColor = isSelected ? '#00f0ff' : 'transparent';
        ctx.shadowBlur = isSelected ? 12 : 0;

        // Aerodynamic car capsule
        ctx.beginPath();
        ctx.roundRect(-8, -4.5, 16, 9, 3);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-1, -3.5, 5, 7);

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(7, -3.5, 2, 2);
        ctx.fillRect(7, 1.5, 2, 2);
      }

      ctx.restore();

      // Selected Vehicle Target Reticle
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(curX, curY, 18, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'center';
        ctx.fillText(id, curX, curY - 22);
        ctx.restore();
      }
    });
  };

  // Mouse Interaction: Click to Select Vehicle, Road, or Intersection
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - camera.x) / camera.scale;
    const mouseY = (e.clientY - rect.top - camera.y) / camera.scale;

    // 1. Check if clicked near a vehicle
    for (let [id, pos] of vehiclePositionsRef.current.entries()) {
      const dist = Math.hypot(mouseX - pos.currentX, mouseY - pos.currentY);
      if (dist < 20) {
        const fullVehicle = cityData?.vehicles?.find(v => v.id === id);
        if (fullVehicle && onSelectVehicle) {
          onSelectVehicle(fullVehicle);
          return;
        }
      }
    }

    // 2. Check if clicked near an intersection node
    if (cityData?.intersections) {
      for (let node of cityData.intersections) {
        const dist = Math.hypot(mouseX - node.x, mouseY - node.y);
        if (dist < 22) {
          if (onSelectNode) {
            onSelectNode(node);
            return;
          }
        }
      }
    }

    // 3. Check if clicked near a road segment
    if (cityData?.roads && cityData?.intersections) {
      const nodeMap = new Map(cityData.intersections.map(n => [n.id, n]));
      for (let road of cityData.roads) {
        const u = nodeMap.get(road.sourceNodeId);
        const v = nodeMap.get(road.targetNodeId);
        if (u && v) {
          const distToSegment = distanceToLineSegment(mouseX, mouseY, u.x, u.y, v.x, v.y);
          if (distToSegment < 12) {
            if (onSelectRoad) {
              onSelectRoad(road);
              return;
            }
          }
        }
      }
    }
  };

  // Mouse Pan Handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setCamera(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setCamera(prev => ({
      ...prev,
      scale: Math.min(2.5, Math.max(0.4, prev.scale * zoomFactor))
    }));
  };

  const resetCamera = () => {
    setCamera({ x: 40, y: 30, scale: 0.95 });
  };

  // Helper geometry
  function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  if (is3DMode) {
    return (
      <SimulationCanvas3D 
        onSelectNode={onSelectNode}
        onSelectRoad={onSelectRoad}
        onSelectVehicle={onSelectVehicle}
        onSwitchTo2D={() => setIs3DMode(false)}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[580px] bg-[#070b14] overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating HUD Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
        {/* Layer Toggles & 3D Switcher */}
        <div className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-lg text-xs">
          <button
            onClick={() => setIs3DMode(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 border border-cyan-400 font-mono font-black shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Box className="w-3.5 h-3.5 fill-current" />
            <span>Switch to 3D View</span>
          </button>
          <button
            onClick={() => setShowTrafficHeatmap(!showTrafficHeatmap)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-all ${
              showTrafficHeatmap ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Traffic Flow</span>
          </button>
          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-all ${
              showLandmarks ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Landmarks</span>
          </button>
        </div>
      </div>

      {/* Camera Controls (Zoom In, Zoom Out, Center) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col space-y-1.5 p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-lg text-slate-300">
        <button
          onClick={() => setCamera(prev => ({ ...prev, scale: Math.min(2.5, prev.scale * 1.15) }))}
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCamera(prev => ({ ...prev, scale: Math.max(0.4, prev.scale * 0.85) }))}
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetCamera}
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center space-x-4 px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 font-mono shadow-xl">
        <span className="text-slate-400 font-bold uppercase tracking-wider">Legend:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Low</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-xs">⛔</span>
          <span>Blocked</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-4 h-1 rounded bg-cyan-400 shadow-sm shadow-cyan-400" />
          <span>A* Route</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-4 h-1 rounded bg-red-500 shadow-sm shadow-red-500" />
          <span>Priority Corridor</span>
        </div>
      </div>
    </div>
  );
}
