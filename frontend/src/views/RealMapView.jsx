import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';
import {
  extractRoadGraphFromMap,
  generateSyntheticRealRoadGrid,
  solveAStar,
  solveDijkstra,
  haversineDistanceMeters,
  CITY_PRESETS,
} from '../services/roadGraphService';
import {
  MapPin,
  Box,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Navigation,
  Crosshair,
  Compass,
  Layers,
  AlertTriangle,
  Siren,
  Car,
  Flame,
  Shield,
  Activity,
  CheckCircle2,
  Sliders,
  Maximize2,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function RealMapView() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const { addToast } = useSimulation();

  // Map state
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/dark-v11');
  const [selectedCity, setSelectedCity] = useState(CITY_PRESETS[0].id);

  // Rectangle Selection State
  const [isDrawingRect, setIsDrawingRect] = useState(false);
  const [activeBbox, setActiveBbox] = useState(CITY_PRESETS[0].defaultBbox);
  const drawStartCoordRef = useRef(null);
  const isMouseDownRef = useRef(false);

  // Graph state
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [isExtractingRoads, setIsExtractingRoads] = useState(false);

  // Navigation & Routing state
  const [startNodeId, setStartNodeId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [pickMode, setPickMode] = useState(null); // 'START' | 'TARGET' | null
  const [algorithm, setAlgorithm] = useState('ASTAR'); // 'ASTAR' | 'DIJKSTRA' | 'EMERGENCY'
  const [routeResult, setRouteResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState(null);

  // Vehicle Animation state
  const [vehicleType, setVehicleType] = useState('AMBULANCE'); // 'CAR' | 'AMBULANCE' | 'FIRE_TRUCK' | 'POLICE'
  const [isDriving, setIsDriving] = useState(false);
  const [driveProgress, setDriveProgress] = useState(0);
  const [driveSpeedMultiplier, setDriveSpeedMultiplier] = useState(1);
  const animFrameRef = useRef(null);
  const vehicleMarkerRef = useRef(null);

  // Search input
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialPreset = CITY_PRESETS[0];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: initialPreset.center,
      zoom: initialPreset.zoom,
      pitch: 35,
      bearing: -10,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);

      // Add Sources and Layers for interactive bounding box, roads, nodes, and route
      initMapLayers(map, initialPreset.defaultBbox);
      // Auto-extract roads for initial preset
      extractRoads(initialPreset.defaultBbox, map);
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (vehicleMarkerRef.current) vehicleMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle map style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.setStyle(mapStyle);
    map.once('style.load', () => {
      initMapLayers(map, activeBbox);
      updateMapLayers(graphData, routeResult, activeBbox);
    });
  }, [mapStyle]);

  /**
   * Initializes all GeoJSON sources and styling layers on the Mapbox instance.
   */
  const initMapLayers = (map, bbox) => {
    if (!map) return;

    // 1. Bounding Box Source & Layers
    if (!map.getSource('selection-bbox')) {
      map.addSource('selection-bbox', {
        type: 'geojson',
        data: bboxToPolygonGeoJSON(bbox),
      });

      // Translucent cyan fill
      map.addLayer({
        id: 'selection-bbox-fill',
        type: 'fill',
        source: 'selection-bbox',
        paint: {
          'fill-color': '#00f0ff',
          'fill-opacity': 0.08,
        },
      });

      // Neon glowing dashed border
      map.addLayer({
        id: 'selection-bbox-line',
        type: 'line',
        source: 'selection-bbox',
        paint: {
          'line-color': '#00f0ff',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
        },
      });
    }

    // 2. Extracted Road Network Lines
    if (!map.getSource('road-network')) {
      map.addSource('road-network', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Road background glow
      map.addLayer({
        id: 'road-network-glow',
        type: 'line',
        source: 'road-network',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'case',
            ['get', 'blocked'],
            '#ef4444',
            '#06b6d4',
          ],
          'line-width': ['case', ['get', 'blocked'], 5, 3],
          'line-opacity': 0.4,
        },
      });

      // Road inner line
      map.addLayer({
        id: 'road-network-line',
        type: 'line',
        source: 'road-network',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'case',
            ['get', 'blocked'],
            '#f87171',
            '#22d3ee',
          ],
          'line-width': 2,
          'line-opacity': 0.85,
        },
      });
    }

    // 3. Computed Shortest Path Route
    if (!map.getSource('route-path')) {
      map.addSource('route-path', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Route Outer Glow
      map.addLayer({
        id: 'route-path-glow',
        type: 'line',
        source: 'route-path',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 8,
          'line-opacity': 0.5,
          'line-blur': 3,
        },
      });

      // Route Inner Neon Core
      map.addLayer({
        id: 'route-path-core',
        type: 'line',
        source: 'route-path',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#34d399',
          'line-width': 4.5,
          'line-opacity': 1,
        },
      });
    }

    // 4. Intersections / Junction Nodes
    if (!map.getSource('road-nodes')) {
      map.addSource('road-nodes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Intersections Circle
      map.addLayer({
        id: 'road-nodes-circle',
        type: 'circle',
        source: 'road-nodes',
        paint: {
          'circle-radius': [
            'case',
            ['get', 'isStart'],
            9,
            ['get', 'isTarget'],
            9,
            5,
          ],
          'circle-color': [
            'case',
            ['get', 'isStart'],
            '#10b981', // Emerald start
            ['get', 'isTarget'],
            '#f43f5e', // Rose target
            '#0ea5e9', // Sky normal
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      // Intersections Text Labels
      map.addLayer({
        id: 'road-nodes-labels',
        type: 'symbol',
        source: 'road-nodes',
        layout: {
          'text-field': ['get', 'id'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#e2e8f0',
          'text-halo-color': '#0f172a',
          'text-halo-width': 1.5,
        },
      });
    }
  };

  /**
   * Helper: Converts [minLng, minLat, maxLng, maxLat] to GeoJSON polygon
   */
  const bboxToPolygonGeoJSON = (bbox) => {
    if (!bbox || bbox.length !== 4) {
      return { type: 'FeatureCollection', features: [] };
    }
    const [minLng, minLat, maxLng, maxLat] = bbox;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
              ],
            ],
          },
          properties: {},
        },
      ],
    };
  };

  /**
   * Synchronizes Graph data, Route geometry, and Nodes to Mapbox layers.
   */
  const updateMapLayers = useCallback(
    (graph, route, bbox) => {
      const map = mapRef.current;
      if (!map || !mapLoaded) return;

      // Update Bbox
      const bboxSource = map.getSource('selection-bbox');
      if (bboxSource) {
        bboxSource.setData(bboxToPolygonGeoJSON(bbox));
      }

      // Update Roads
      const roadSource = map.getSource('road-network');
      if (roadSource && graph?.edges) {
        const roadFeatures = graph.edges
          .filter((e) => !e.id.endsWith('_rev')) // Only render forward direction to prevent double-line overlapping
          .map((e) => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: e.geometry || [],
            },
            properties: {
              id: e.id,
              name: e.name,
              blocked: e.blocked,
              speedLimit: e.speedLimit,
              distance: e.distance,
            },
          }));

        roadSource.setData({
          type: 'FeatureCollection',
          features: roadFeatures,
        });
      }

      // Update Nodes
      const nodeSource = map.getSource('road-nodes');
      if (nodeSource && graph?.nodes) {
        const nodeFeatures = graph.nodes.map((n) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: n.coordinates,
          },
          properties: {
            id: n.id,
            name: n.name,
            isStart: n.id === startNodeId,
            isTarget: n.id === targetNodeId,
          },
        }));

        nodeSource.setData({
          type: 'FeatureCollection',
          features: nodeFeatures,
        });
      }

      // Update Route
      const routeSource = map.getSource('route-path');
      if (routeSource) {
        if (route && route.found && route.pathNodes && route.pathNodes.length >= 2) {
          const coords = route.pathNodes.map((n) => n.coordinates);
          routeSource.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: coords,
                },
                properties: {},
              },
            ],
          });
        } else {
          routeSource.setData({ type: 'FeatureCollection', features: [] });
        }
      }
    },
    [mapLoaded, startNodeId, targetNodeId]
  );

  /**
   * Extracts roads and builds graph for a given bounding box.
   */
  const extractRoads = useCallback(
    (bbox, mapInstance = mapRef.current) => {
      if (!bbox || !mapInstance) return;
      setIsExtractingRoads(true);

      setTimeout(() => {
        try {
          let graph = extractRoadGraphFromMap(mapInstance, bbox);

          // If extracted roads are too sparse, guarantee rich connectivity with real-coordinate grid
          if (!graph || graph.nodes.length < 4) {
            graph = generateSyntheticRealRoadGrid(bbox);
          }

          setGraphData(graph);

          // Set default start and target nodes
          if (graph.nodes.length >= 2) {
            setStartNodeId(graph.nodes[0].id);
            setTargetNodeId(graph.nodes[graph.nodes.length - 1].id);
          }

          setRouteResult(null);
          updateMapLayers(graph, null, bbox);
          addToast(
            `Extracted ${graph.nodes.length} intersections and ${graph.edges.length / 2} real road segments!`,
            'success'
          );
        } catch (err) {
          console.error('Road extraction error:', err);
          const fallback = generateSyntheticRealRoadGrid(bbox);
          setGraphData(fallback);
          updateMapLayers(fallback, null, bbox);
        } finally {
          setIsExtractingRoads(false);
        }
      }, 300);
    },
    [addToast, updateMapLayers]
  );

  // Synchronize layer data when graph, route, or nodes change
  useEffect(() => {
    updateMapLayers(graphData, routeResult, activeBbox);
  }, [graphData, routeResult, activeBbox, updateMapLayers]);

  /**
   * Rectangle Drawing Events on Mapbox
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const onMouseDown = (e) => {
      if (!isDrawingRect) return;
      isMouseDownRef.current = true;
      const lngLat = [e.lngLat.lng, e.lngLat.lat];
      drawStartCoordRef.current = lngLat;
      map.getCanvas().style.cursor = 'crosshair';
    };

    const onMouseMove = (e) => {
      if (!isDrawingRect || !isMouseDownRef.current || !drawStartCoordRef.current) return;

      const currentLngLat = [e.lngLat.lng, e.lngLat.lat];
      const start = drawStartCoordRef.current;

      const minLng = Math.min(start[0], currentLngLat[0]);
      const maxLng = Math.max(start[0], currentLngLat[0]);
      const minLat = Math.min(start[1], currentLngLat[1]);
      const maxLat = Math.max(start[1], currentLngLat[1]);

      const tempBbox = [minLng, minLat, maxLng, maxLat];
      const bboxSource = map.getSource('selection-bbox');
      if (bboxSource) {
        bboxSource.setData(bboxToPolygonGeoJSON(tempBbox));
      }
    };

    const onMouseUp = (e) => {
      if (!isDrawingRect || !isMouseDownRef.current || !drawStartCoordRef.current) return;
      isMouseDownRef.current = false;

      const currentLngLat = [e.lngLat.lng, e.lngLat.lat];
      const start = drawStartCoordRef.current;

      const minLng = Math.min(start[0], currentLngLat[0]);
      const maxLng = Math.max(start[0], currentLngLat[0]);
      const minLat = Math.min(start[1], currentLngLat[1]);
      const maxLat = Math.max(start[1], currentLngLat[1]);

      // Check minimum drag distance to prevent accidental tiny clicks
      if (Math.abs(maxLng - minLng) < 0.002 || Math.abs(maxLat - minLat) < 0.002) {
        addToast('Please drag a larger rectangle across the map.', 'warning');
        return;
      }

      const finalBbox = [minLng, minLat, maxLng, maxLat];
      setActiveBbox(finalBbox);
      setIsDrawingRect(false);
      map.dragPan.enable();
      map.getCanvas().style.cursor = '';

      addToast('Bounding rectangle defined. Extracting real road network...', 'info');
      extractRoads(finalBbox, map);
    };

    // Node & Road Click Handlers
    const onClick = (e) => {
      if (isDrawingRect) return;

      // Check if user clicked an intersection node
      const nodeFeatures = map.queryRenderedFeatures(e.point, { layers: ['road-nodes-circle'] });
      if (nodeFeatures.length > 0) {
        const clickedNodeId = nodeFeatures[0].properties.id;
        if (pickMode === 'START') {
          setStartNodeId(clickedNodeId);
          setPickMode(null);
          addToast(`Start node set to ${clickedNodeId}`, 'success');
        } else if (pickMode === 'TARGET') {
          setTargetNodeId(clickedNodeId);
          setPickMode(null);
          addToast(`Destination set to ${clickedNodeId}`, 'success');
        } else {
          // Default click sets start or target
          if (!startNodeId || (startNodeId && targetNodeId)) {
            setStartNodeId(clickedNodeId);
            setRouteResult(null);
          } else {
            setTargetNodeId(clickedNodeId);
          }
        }
        return;
      }

      // Check if user clicked a road segment
      const roadFeatures = map.queryRenderedFeatures(e.point, { layers: ['road-network-line'] });
      if (roadFeatures.length > 0) {
        const clickedRoadId = roadFeatures[0].properties.id;
        const road = graphData.edges.find((ed) => ed.id === clickedRoadId);
        if (road) {
          setSelectedRoad(road);
        }
      }
    };

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    map.on('click', onClick);

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      map.off('click', onClick);
    };
  }, [isDrawingRect, pickMode, graphData, startNodeId, targetNodeId, extractRoads, addToast, mapLoaded]);

  /**
   * Toggle rectangle drawing mode
   */
  const handleToggleDrawRect = () => {
    const map = mapRef.current;
    if (!map) return;

    if (!isDrawingRect) {
      setIsDrawingRect(true);
      map.dragPan.disable();
      map.getCanvas().style.cursor = 'crosshair';
      addToast('Draw Mode Active: Click and drag across any streets on the map!', 'info');
    } else {
      setIsDrawingRect(false);
      map.dragPan.enable();
      map.getCanvas().style.cursor = '';
    }
  };

  /**
   * Handle City Preset Change
   */
  const handleSelectCity = (presetId) => {
    const preset = CITY_PRESETS.find((p) => p.id === presetId);
    if (!preset || !mapRef.current) return;

    setSelectedCity(presetId);
    setActiveBbox(preset.defaultBbox);

    mapRef.current.flyTo({
      center: preset.center,
      zoom: preset.zoom,
      pitch: 35,
      essential: true,
    });

    mapRef.current.once('moveend', () => {
      extractRoads(preset.defaultBbox, mapRef.current);
    });
  };

  /**
   * Search location geocoding
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;
    setIsSearching(true);

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const d = 0.01;
        const newBbox = [lng - d, lat - d * 0.8, lng + d, lat + d * 0.8];

        mapRef.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 35 });
        setActiveBbox(newBbox);

        mapRef.current.once('moveend', () => {
          extractRoads(newBbox, mapRef.current);
        });

        addToast(`Navigated to ${data.features[0].place_name}`, 'success');
      } else {
        addToast('No location found for search query.', 'warning');
      }
    } catch (err) {
      addToast('Location search failed.', 'danger');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Calculate Route (Calls backend API with client-side fallback)
   */
  const handleCalculateRoute = async () => {
    if (!startNodeId || !targetNodeId) {
      addToast('Please select both a Start node and Destination node.', 'warning');
      return;
    }

    if (startNodeId === targetNodeId) {
      addToast('Start and Destination are the same node.', 'warning');
      return;
    }

    setIsCalculating(true);
    const isEmergency = algorithm === 'EMERGENCY';

    try {
      // 1. Attempt Spring Boot Backend Dynamic Graph API
      const payload = {
        nodes: graphData.nodes,
        edges: graphData.edges,
        sourceNodeId: startNodeId,
        targetNodeId: targetNodeId,
        strategy: algorithm,
        isEmergency,
      };

      let result;
      try {
        result = await api.calculateDynamicRoute(payload);
      } catch (backendErr) {
        // 2. Client-Side High-Speed Fallback Solver
        if (algorithm === 'DIJKSTRA') {
          result = solveDijkstra(graphData.nodes, graphData.edges, startNodeId, targetNodeId);
        } else {
          result = solveAStar(graphData.nodes, graphData.edges, startNodeId, targetNodeId, isEmergency);
        }
      }

      if (result && result.found) {
        setRouteResult(result);
        addToast(
          `Shortest Route computed (${result.totalDistance}m, ${result.nodesEvaluated || result.nodeIds.length} nodes evaluated)!`,
          'success'
        );
      } else {
        setRouteResult(null);
        addToast(result?.message || 'No path found between selected nodes.', 'danger');
      }
    } catch (err) {
      addToast(err.message || 'Path calculation error.', 'danger');
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Toggle Road Blocked Status
   */
  const handleToggleBlockRoad = (roadId) => {
    const updatedEdges = graphData.edges.map((e) => {
      if (e.id === roadId || e.id === roadId.replace('_fwd', '_rev') || e.id === roadId.replace('_rev', '_fwd')) {
        return { ...e, blocked: !e.blocked };
      }
      return e;
    });

    const isNowBlocked = !selectedRoad?.blocked;
    setGraphData({ ...graphData, edges: updatedEdges });
    if (selectedRoad) {
      setSelectedRoad({ ...selectedRoad, blocked: isNowBlocked });
    }

    addToast(
      isNowBlocked
        ? `Road ${selectedRoad?.name || roadId} BLOCKED (Accident simulated)!`
        : `Road ${selectedRoad?.name || roadId} unblocked.`,
      isNowBlocked ? 'warning' : 'success'
    );

    // Auto-recalculate if active route used this road
    if (routeResult?.found && startNodeId && targetNodeId) {
      setTimeout(() => {
        handleCalculateRoute();
      }, 100);
    }
  };

  /**
   * Randomize Start & End Waypoints
   */
  const handleRandomizeWaypoints = () => {
    if (!graphData.nodes || graphData.nodes.length < 2) return;
    const len = graphData.nodes.length;
    const i1 = Math.floor(Math.random() * len);
    let i2 = Math.floor(Math.random() * len);
    while (i2 === i1) i2 = Math.floor(Math.random() * len);

    setStartNodeId(graphData.nodes[i1].id);
    setTargetNodeId(graphData.nodes[i2].id);
    setRouteResult(null);
  };

  /**
   * Animate Vehicle Driving along the Computed Real Road Path
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeResult?.found || !routeResult?.pathNodes || routeResult.pathNodes.length < 2) {
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
      }
      return;
    }

    const pathCoords = routeResult.pathNodes.map((n) => n.coordinates);

    // Create custom vehicle DOM element
    if (!vehicleMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'custom-vehicle-marker';
      el.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0f172a;
          border: 2px solid #00f0ff;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.8);
          transform: translate(-50%, -50%);
          font-size: 16px;
        ">
          ${
            vehicleType === 'AMBULANCE'
              ? '🚑'
              : vehicleType === 'FIRE_TRUCK'
              ? '🚒'
              : vehicleType === 'POLICE'
              ? '🚓'
              : '🚗'
          }
        </div>
      `;
      vehicleMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat(pathCoords[0])
        .addTo(map);
    }

    if (!isDriving) return;

    let startTime = null;
    const totalDistance = routeResult.totalDistance || 1000;
    // Base duration in seconds based on distance and speed multiplier
    const totalDurationMs = Math.max(3000, (totalDistance / 25) * 1000) / driveSpeedMultiplier;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);
      setDriveProgress(progress);

      // Interpolate along coordinates
      const totalSegments = pathCoords.length - 1;
      const currentSegmentIndex = Math.min(
        totalSegments - 1,
        Math.floor(progress * totalSegments)
      );
      const segmentProgress =
        progress * totalSegments - currentSegmentIndex;

      const pStart = pathCoords[currentSegmentIndex];
      const pEnd = pathCoords[currentSegmentIndex + 1];

      const currentLng = pStart[0] + (pEnd[0] - pStart[0]) * segmentProgress;
      const currentLat = pStart[1] + (pEnd[1] - pStart[1]) * segmentProgress;

      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setLngLat([currentLng, currentLat]);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsDriving(false);
        addToast('Vehicle reached destination waypoint!', 'success');
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDriving, routeResult, driveSpeedMultiplier, vehicleType, addToast]);

  return (
    <div className="flex flex-col space-y-4 h-[calc(100vh-130px)] min-h-[700px]">
      {/* Top Header & Preset Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        {/* Title & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center space-x-2">
              <span>Real Map Road Navigator</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Mapbox GL JS
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Draw bounding rectangles to extract real street networks and execute shortest-path sorting algorithms
            </p>
          </div>
        </div>

        {/* City Presets & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* City Presets Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedCity}
              onChange={(e) => handleSelectCity(e.target.value)}
              className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
            >
              {CITY_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.country} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Location Form */}
          <form onSubmit={handleSearch} className="flex items-center bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <input
              type="text"
              placeholder="Search any city or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none w-44 font-mono"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="text-[10px] uppercase font-bold text-cyan-400 hover:text-cyan-300 font-mono ml-1"
            >
              Go
            </button>
          </form>

          {/* Map Style Selector */}
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                mapStyle.includes('dark') ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapStyle('mapbox://styles/mapbox/navigation-night-v1')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                mapStyle.includes('navigation') ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Night
            </button>
            <button
              onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                mapStyle.includes('satellite') ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Mapbox Canvas Viewport (8 Columns) */}
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-slate-800 bg-[#070b14] shadow-2xl flex flex-col">
          {/* Top Map Floating Action Bar */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
            {/* Draw Rectangle Mode Button */}
            <button
              onClick={handleToggleDrawRect}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold shadow-lg transition-all ${
                isDrawingRect
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/80 animate-pulse'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>{isDrawingRect ? 'DRAGGING ACTIVE...' : 'DRAW RECTANGLE'}</span>
            </button>

            {/* Refresh / Re-extract Road Graph */}
            <button
              onClick={() => extractRoads(activeBbox)}
              disabled={isExtractingRoads}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono shadow-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isExtractingRoads ? 'animate-spin' : ''}`} />
              <span>SCAN ROADS</span>
            </button>

            {/* Randomize Waypoints */}
            <button
              onClick={handleRandomizeWaypoints}
              className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>RANDOM PINS</span>
            </button>
          </div>

          {/* Floating Instructions Banner when Drawing */}
          {isDrawingRect && (
            <div className="absolute top-16 left-3 right-3 z-10 bg-amber-500/95 text-slate-950 text-xs px-4 py-2 rounded-xl font-mono font-bold flex items-center justify-between shadow-2xl animate-fade-in">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4" />
                <span>Click and drag on the map to define the road navigation boundary!</span>
              </div>
              <button
                onClick={() => setIsDrawingRect(false)}
                className="px-2 py-0.5 rounded bg-slate-950 text-white text-[10px] uppercase font-bold"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Mapbox Map Container */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[480px]" />

          {/* Bottom Telemetry Overlay on Map */}
          <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex flex-wrap items-center justify-between gap-2">
            <div className="pointer-events-auto flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-cyan-400 font-bold">{graphData.nodes.length}</span>
              <span className="text-slate-400">Intersections</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 font-bold">{graphData.edges.length / 2}</span>
              <span className="text-slate-400">Roads</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">
                {activeBbox
                  ? `${(
                      haversineDistanceMeters(
                        [activeBbox[0], activeBbox[1]],
                        [activeBbox[2], activeBbox[1]]
                      ) / 1000
                    ).toFixed(2)} km × ${(
                      haversineDistanceMeters(
                        [activeBbox[0], activeBbox[1]],
                        [activeBbox[0], activeBbox[3]]
                      ) / 1000
                    ).toFixed(2)} km`
                  : '0 km'}
              </span>
              <span className="text-slate-400">Sector</span>
            </div>

            {routeResult?.found && (
              <div className="pointer-events-auto flex items-center space-x-3 bg-emerald-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-emerald-500/40 text-xs font-mono text-emerald-300 shadow-xl">
                <span className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{routeResult.totalDistance}m</span>
                </span>
                <span className="text-emerald-500">|</span>
                <span>~{Math.round(routeResult.estimatedTravelTime)}s ETA</span>
                <span className="text-emerald-500">|</span>
                <span className="text-amber-300">{routeResult.executionTimeMs || '<1'}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Algorithm & Navigation Controls (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col space-y-3.5 overflow-y-auto pr-1">
          {/* 1. Path Calculation Card */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-white flex items-center space-x-2 mb-3">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Real Road Route Solver</span>
            </h3>

            {/* Start and Target Nodes Selector */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center justify-between">
                  <span>Start Pin:</span>
                  <button
                    type="button"
                    onClick={() => setPickMode(pickMode === 'START' ? null : 'START')}
                    className={`text-[9px] px-1 rounded ${
                      pickMode === 'START' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:underline'
                    }`}
                  >
                    {pickMode === 'START' ? 'Click Map' : 'Pick on Map'}
                  </button>
                </label>
                <select
                  value={startNodeId}
                  onChange={(e) => setStartNodeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-emerald-300 font-mono"
                >
                  {graphData.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.id} - {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center justify-between">
                  <span>Target Pin:</span>
                  <button
                    type="button"
                    onClick={() => setPickMode(pickMode === 'TARGET' ? null : 'TARGET')}
                    className={`text-[9px] px-1 rounded ${
                      pickMode === 'TARGET' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400 hover:underline'
                    }`}
                  >
                    {pickMode === 'TARGET' ? 'Click Map' : 'Pick on Map'}
                  </button>
                </label>
                <select
                  value={targetNodeId}
                  onChange={(e) => setTargetNodeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-rose-300 font-mono"
                >
                  {graphData.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.id} - {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Algorithm Selector Buttons */}
            <div className="space-y-1 mb-3">
              <label className="text-[10px] font-mono text-slate-400 block">Shortest Path Algorithm:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'ASTAR', label: 'A* Heuristic', icon: Zap },
                  { id: 'DIJKSTRA', label: 'Dijkstra', icon: Sliders },
                  { id: 'EMERGENCY', label: 'Emergency', icon: Siren },
                ].map((algo) => {
                  const Icon = algo.icon;
                  const active = algorithm === algo.id;
                  return (
                    <button
                      key={algo.id}
                      type="button"
                      onClick={() => setAlgorithm(algo.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-mono transition-all ${
                        active
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span>{algo.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Solve Route Button */}
            <button
              onClick={handleCalculateRoute}
              disabled={isCalculating || !startNodeId || !targetNodeId}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Graph Nodes...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Compute Real Road Path</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Vehicle Driving & Simulation Console */}
          {routeResult?.found && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
              <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-white flex items-center justify-between mb-3">
                <span className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>Navigate Real Streets</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-normal">
                  {routeResult.nodeIds.length} Waypoints
                </span>
              </h3>

              {/* Vehicle Type Selection */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { id: 'CAR', icon: Car, label: 'Car' },
                  { id: 'AMBULANCE', icon: Siren, label: 'Ambulance' },
                  { id: 'FIRE_TRUCK', icon: Flame, label: 'Fire' },
                  { id: 'POLICE', icon: Shield, label: 'Police' },
                ].map((v) => {
                  const Icon = v.icon;
                  const active = vehicleType === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicleType(v.id)}
                      className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono font-bold flex flex-col items-center space-y-1 transition-all ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-3">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${Math.round(driveProgress * 100)}%` }}
                />
              </div>

              {/* Drive Action Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDriving(!isDriving)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    isDriving
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {isDriving ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isDriving ? 'PAUSE' : 'START DRIVE'}</span>
                </button>

                {/* Speed Multiplier Toggle */}
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setDriveSpeedMultiplier(spd)}
                    className={`px-2 py-2 rounded-xl border text-[10px] font-mono font-bold ${
                      driveSpeedMultiplier === spd
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Interactive Road Inspection & Block Tool */}
          {selectedRoad && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
              <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-white flex items-center justify-between mb-2">
                <span className="flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Inspect Street Segment</span>
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    selectedRoad.blocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {selectedRoad.blocked ? 'BLOCKED' : 'OPEN'}
                </span>
              </h3>

              <div className="space-y-1.5 text-xs text-slate-300 font-mono mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Street Name:</span>
                  <span className="text-white font-bold">{selectedRoad.name || selectedRoad.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Length:</span>
                  <span>{Math.round(selectedRoad.distance)} meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Speed Limit:</span>
                  <span>{selectedRoad.speedLimit || 50} km/h</span>
                </div>
              </div>

              <button
                onClick={() => handleToggleBlockRoad(selectedRoad.id)}
                className={`w-full py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                  selectedRoad.blocked
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'
                }`}
              >
                {selectedRoad.blocked ? 'Unblock Road (Clear Accident)' : 'Block Road (Simulate Accident)'}
              </button>
            </div>
          )}

          {/* 4. Telemetry & Algorithm Metrics */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md text-xs font-mono">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center space-x-2 mb-2.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Algorithm Performance Telemetry</span>
            </h3>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Active Strategy:</span>
                <span className="text-cyan-300 font-bold">{algorithm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Nodes in Bbox:</span>
                <span>{graphData.nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Edges in Bbox:</span>
                <span>{graphData.edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nodes Evaluated:</span>
                <span className="text-amber-300 font-bold">
                  {routeResult?.nodesEvaluated || (routeResult?.found ? routeResult.nodeIds.length : 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Execution Time:</span>
                <span className="text-emerald-400 font-bold">
                  {routeResult?.executionTimeMs ? `${routeResult.executionTimeMs} ms` : '< 1 ms'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
