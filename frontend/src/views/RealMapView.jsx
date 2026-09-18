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
  fetchMapboxDirectionsRoute,
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
  X,
  ExternalLink,
} from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Quick search locations
const POPULAR_LOCATIONS = [
  { name: 'Dhanmondi, Dhaka', query: 'Dhanmondi, Dhaka, Bangladesh' },
  { name: 'Gulshan 2, Dhaka', query: 'Gulshan 2, Dhaka, Bangladesh' },
  { name: 'Shahbagh, Dhaka', query: 'Shahbagh, Dhaka, Bangladesh' },
  { name: 'Banani, Dhaka', query: 'Banani, Dhaka, Bangladesh' },
  { name: 'Times Square, NYC', query: 'Times Square, Manhattan, New York' },
  { name: 'Shibuya, Tokyo', query: 'Shibuya, Tokyo, Japan' },
  { name: 'Westminster, London', query: 'Westminster, London, UK' },
];

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
  const [vehicleType, setVehicleType] = useState('AMBULANCE');
  const [isDriving, setIsDriving] = useState(false);
  const [driveProgress, setDriveProgress] = useState(0);
  const [driveSpeedMultiplier, setDriveSpeedMultiplier] = useState(1);
  const animFrameRef = useRef(null);
  const vehicleMarkerRef = useRef(null);

  // Location Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

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

      initMapLayers(map, initialPreset.defaultBbox);
      extractRoads(initialPreset.defaultBbox, map);
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (vehicleMarkerRef.current) vehicleMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle style changes
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
   * Initializes all GeoJSON sources and styling layers on Mapbox.
   */
  const initMapLayers = (map, bbox) => {
    if (!map) return;

    // 1. Bounding Box Source & Layers
    if (!map.getSource('selection-bbox')) {
      map.addSource('selection-bbox', {
        type: 'geojson',
        data: bboxToPolygonGeoJSON(bbox),
      });

      map.addLayer({
        id: 'selection-bbox-fill',
        type: 'fill',
        source: 'selection-bbox',
        paint: {
          'fill-color': '#00f0ff',
          'fill-opacity': 0.08,
        },
      });

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

      map.addLayer({
        id: 'route-path-glow',
        type: 'line',
        source: 'route-path',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 8,
          'line-opacity': 0.6,
          'line-blur': 3,
        },
      });

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
            '#10b981',
            ['get', 'isTarget'],
            '#f43f5e',
            '#0ea5e9',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

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
   * Helper: Converts bbox to GeoJSON polygon
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
 * Safely extracts [lng, lat] coordinate numbers from any node object.
 */
function getNodeCoordinates(node) {
  if (!node) return null;
  if (Array.isArray(node.coordinates) && node.coordinates.length >= 2 && !isNaN(node.coordinates[0]) && !isNaN(node.coordinates[1])) {
    return [Number(node.coordinates[0]), Number(node.coordinates[1])];
  }
  if (node.x !== undefined && node.y !== undefined && !isNaN(node.x) && !isNaN(node.y)) {
    return [Number(node.x), Number(node.y)];
  }
  if (node.lng !== undefined && node.lat !== undefined && !isNaN(node.lng) && !isNaN(node.lat)) {
    return [Number(node.lng), Number(node.lat)];
  }
  return null;
}

  /**
   * Synchronizes Graph, Route, and Nodes to Mapbox layers with strict coordinate safety.
   */
  const updateMapLayers = useCallback(
    (graph, route, bbox) => {
      const map = mapRef.current;
      if (!map || !mapLoaded) return;

      try {
        const bboxSource = map.getSource('selection-bbox');
        if (bboxSource) {
          bboxSource.setData(bboxToPolygonGeoJSON(bbox));
        }

        const roadSource = map.getSource('road-network');
        if (roadSource && graph?.edges) {
          const roadFeatures = graph.edges
            .filter((e) => !e.id.endsWith('_rev'))
            .map((e) => {
              let coords = e.geometry;
              if (!coords || !Array.isArray(coords) || coords.length < 2 || !Array.isArray(coords[0])) {
                const src = graph.nodes?.find((n) => n.id === e.sourceNodeId);
                const tgt = graph.nodes?.find((n) => n.id === e.targetNodeId);
                const c1 = getNodeCoordinates(src);
                const c2 = getNodeCoordinates(tgt);
                if (c1 && c2) coords = [c1, c2];
              }
              if (!coords || !Array.isArray(coords) || coords.length < 2) return null;

              const validCoords = coords
                .map((c) => (Array.isArray(c) && !isNaN(c[0]) && !isNaN(c[1]) ? [Number(c[0]), Number(c[1])] : null))
                .filter(Boolean);

              if (validCoords.length < 2) return null;

              return {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: validCoords,
                },
                properties: {
                  id: e.id,
                  name: e.name,
                  blocked: Boolean(e.blocked),
                  speedLimit: e.speedLimit || 50,
                  distance: e.distance || 100,
                },
              };
            })
            .filter(Boolean);

          roadSource.setData({
            type: 'FeatureCollection',
            features: roadFeatures,
          });
        }

        const nodeSource = map.getSource('road-nodes');
        if (nodeSource && graph?.nodes) {
          const nodeFeatures = graph.nodes
            .map((n) => {
              const coords = getNodeCoordinates(n);
              if (!coords) return null;
              return {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: coords,
                },
                properties: {
                  id: n.id,
                  name: n.name,
                  isStart: n.id === startNodeId,
                  isTarget: n.id === targetNodeId,
                },
              };
            })
            .filter(Boolean);

          nodeSource.setData({
            type: 'FeatureCollection',
            features: nodeFeatures,
          });
        }

        const routeSource = map.getSource('route-path');
        if (routeSource) {
          if (route && route.found && route.pathNodes && route.pathNodes.length >= 2) {
            const coords = route.pathNodes
              .map((n) => getNodeCoordinates(n))
              .filter((c) => Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1]));

            if (coords.length >= 2) {
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

              // Automatically focus map on the computed route
              try {
                const bounds = coords.reduce(
                  (b, c) => b.extend(c),
                  new mapboxgl.LngLatBounds(coords[0], coords[0])
                );
                map.fitBounds(bounds, { padding: 75, maxZoom: 16.5, duration: 800 });
              } catch (fitErr) {
                // Ignore camera adjustment error
              }
            } else {
              routeSource.setData({ type: 'FeatureCollection', features: [] });
            }
          } else {
            routeSource.setData({ type: 'FeatureCollection', features: [] });
          }
        }
      } catch (err) {
        console.error('Error updating Mapbox layers:', err);
      }
    },
    [mapLoaded, startNodeId, targetNodeId]
  );

  /**
   * Extracts roads and builds connected graph for any bounding box (large or small).
   */
  const extractRoads = useCallback(
    (bbox, mapInstance = mapRef.current) => {
      if (!bbox || !mapInstance) return;
      setIsExtractingRoads(true);

      setTimeout(() => {
        try {
          let graph = extractRoadGraphFromMap(mapInstance, bbox);

          // If extracted roads are too sparse, guarantee rich connectivity with real GPS grid
          if (!graph || graph.nodes.length < 2) {
            graph = generateSyntheticRealRoadGrid(bbox);
          }

          setGraphData(graph);

          if (graph.nodes.length >= 2) {
            setStartNodeId(graph.nodes[0].id);
            setTargetNodeId(graph.nodes[graph.nodes.length - 1].id);
          }

          setRouteResult(null);
          updateMapLayers(graph, null, bbox);
          addToast(
            `Extracted ${graph.nodes.length} intersections and ${graph.edges.length / 2} connected street segments!`,
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
      }, 250);
    },
    [addToast, updateMapLayers]
  );

  useEffect(() => {
    updateMapLayers(graphData, routeResult, activeBbox);
  }, [graphData, routeResult, activeBbox, updateMapLayers]);

  /**
   * Rectangle Drawing Events on Mapbox (Accepts small rectangles as well!)
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

      // Accept small rectangles! Only ignore accidental zero-pixel clicks (under 10 meters)
      if (Math.abs(maxLng - minLng) < 0.00008 && Math.abs(maxLat - minLat) < 0.00008) {
        setIsDrawingRect(false);
        map.dragPan.enable();
        map.getCanvas().style.cursor = '';
        return;
      }

      const finalBbox = [minLng, minLat, maxLng, maxLat];
      setActiveBbox(finalBbox);
      setIsDrawingRect(false);
      map.dragPan.enable();
      map.getCanvas().style.cursor = '';

      addToast('Bounding rectangle defined. Extracting connected road network...', 'info');
      extractRoads(finalBbox, map);
    };

    const onClick = (e) => {
      if (isDrawingRect) return;

      const nodeFeatures = map.queryRenderedFeatures(e.point, { layers: ['road-nodes-circle'] });
      if (nodeFeatures.length > 0) {
        const clickedNodeId = nodeFeatures[0].properties.id;
        if (pickMode === 'START') {
          setStartNodeId(clickedNodeId);
          setRouteResult(null);
          setPickMode(null);
          addToast(`Start waypoint set to ${clickedNodeId}`, 'success');
        } else if (pickMode === 'TARGET') {
          setTargetNodeId(clickedNodeId);
          setRouteResult(null);
          setPickMode(null);
          addToast(`Destination set to ${clickedNodeId}`, 'success');
        } else {
          if (!startNodeId || (startNodeId && targetNodeId)) {
            setStartNodeId(clickedNodeId);
            setRouteResult(null);
          } else {
            setTargetNodeId(clickedNodeId);
            setRouteResult(null);
          }
        }
        return;
      }

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
      addToast('Draw Mode Active: Drag any rectangle across streets (small or large)!', 'info');
    } else {
      setIsDrawingRect(false);
      map.dragPan.enable();
      map.getCanvas().style.cursor = '';
    }
  };

  /**
   * Handle City Preset Selection
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
   * Search location geocoding with instant fly-to and auto-bounding box
   */
  const handleLocationSearch = async (queryText) => {
    const query = queryText || searchQuery;
    if (!query.trim() || !mapRef.current) return;
    setIsSearching(true);
    setShowSearchDropdown(false);

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${MAPBOX_TOKEN}&limit=5`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const [lng, lat] = place.center;
        const dLng = 0.008;
        const dLat = 0.006;
        const newBbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat];

        mapRef.current.flyTo({ center: [lng, lat], zoom: 15.5, pitch: 35 });
        setActiveBbox(newBbox);

        mapRef.current.once('moveend', () => {
          extractRoads(newBbox, mapRef.current);
        });

        addToast(`Navigated to ${place.text || place.place_name}`, 'success');
      } else {
        addToast('No location found for this search.', 'warning');
      }
    } catch (err) {
      addToast('Location search failed. Check connection.', 'danger');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Autocomplete live suggestions as user types
   */
  const handleSearchInputChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length >= 3) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          val
        )}.json?access_token=${MAPBOX_TOKEN}&limit=4`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features) {
          setSearchResults(data.features);
          setShowSearchDropdown(true);
        }
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  /**
   * Robust Shortest-Path Calculation
   * Checks Spring Boot API, local A-Star / Dijkstra with snapping, and Mapbox Directions fallback to GUARANTEE a valid route!
   */
  const handleCalculateRoute = async () => {
    if (!startNodeId || !targetNodeId) {
      addToast('Please select both a Start node and Destination node.', 'warning');
      return;
    }

    if (startNodeId === targetNodeId) {
      addToast('Start and Destination are identical.', 'warning');
      return;
    }

    setIsCalculating(true);
    const isEmergency = algorithm === 'EMERGENCY';

    const startNode = graphData.nodes.find((n) => n.id === startNodeId);
    const targetNode = graphData.nodes.find((n) => n.id === targetNodeId);

    if (!startNode || !targetNode) {
      addToast('Selected nodes not found in active graph.', 'warning');
      setIsCalculating(false);
      return;
    }

    try {
      let result = null;

      // 1. Try Spring Boot Backend Dynamic Graph API
      try {
        const payload = {
          nodes: graphData.nodes,
          edges: graphData.edges,
          sourceNodeId: startNodeId,
          targetNodeId: targetNodeId,
          strategy: algorithm,
          isEmergency,
        };
        const backendRes = await api.calculateDynamicRoute(payload);
        if (backendRes && backendRes.found) {
          result = backendRes;
        }
      } catch (backendErr) {
        console.warn('Backend API evaluation failed, trying local engine:', backendErr);
      }

      // 2. Local A* / Dijkstra evaluation if backend didn't return a route
      if (!result || !result.found) {
        if (algorithm === 'DIJKSTRA') {
          result = solveDijkstra(graphData.nodes, graphData.edges, startNodeId, targetNodeId);
        } else {
          result = solveAStar(graphData.nodes, graphData.edges, startNodeId, targetNodeId, isEmergency);
        }
      }

      // 3. Guaranteed Route Fallback: Mapbox Directions API
      // If local graph segments were disconnected, fetch the real-world street route
      if (!result || !result.found) {
        addToast('Bridging street gap via real-world driving corridor...', 'info');
        const mapboxRoute = await fetchMapboxDirectionsRoute(
          startNode.coordinates,
          targetNode.coordinates,
          MAPBOX_TOKEN
        );
        if (mapboxRoute && mapboxRoute.found) {
          result = mapboxRoute;
        }
      }

      if (result && result.found) {
        // Guarantee pathNodes has valid coordinates and numbers
        if (result.pathNodes) {
          result.pathNodes = result.pathNodes
            .map((n) => {
              const coords = getNodeCoordinates(n);
              if (!coords) return null;
              return {
                ...n,
                x: coords[0],
                y: coords[1],
                coordinates: coords,
              };
            })
            .filter(Boolean);
        }

        setRouteResult(result);
        addToast(
          `Optimal path computed: ${result.totalDistance}m (~${Math.round(
            result.estimatedTravelTime || 0
          )}s ETA)!`,
          'success'
        );
      } else {
        setRouteResult(null);
        addToast(
          result?.message || 'Could not find a path between these points.',
          'danger'
        );
      }
    } catch (err) {
      addToast(err.message || 'Route calculation error.', 'danger');
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Toggle Road Blocked Status
   */
  const handleToggleBlockRoad = (roadId) => {
    const updatedEdges = graphData.edges.map((e) => {
      if (
        e.id === roadId ||
        e.id === roadId.replace('_fwd', '_rev') ||
        e.id === roadId.replace('_rev', '_fwd')
      ) {
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
        : `Road ${selectedRoad?.name || roadId} restored.`,
      isNowBlocked ? 'warning' : 'success'
    );

    // Dynamic bypass recalculation
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

    const pathCoords = (routeResult.pathNodes || [])
      .map((n) => getNodeCoordinates(n))
      .filter((c) => Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1]));

    if (pathCoords.length < 2) {
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
      }
      return;
    }

    try {
      if (!vehicleMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'custom-vehicle-marker';
        el.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #0f172a;
            border: 2px solid #00f0ff;
            box-shadow: 0 0 16px rgba(0, 240, 255, 0.9);
            transform: translate(-50%, -50%);
            font-size: 18px;
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
      } else {
        vehicleMarkerRef.current.setLngLat(pathCoords[0]);
      }
    } catch (markerErr) {
      console.warn('Marker creation error:', markerErr);
    }

    if (!isDriving) return;

    let startTime = null;
    const totalDistance = routeResult.totalDistance || 1000;
    const totalDurationMs = Math.max(3000, (totalDistance / 25) * 1000) / driveSpeedMultiplier;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);
      setDriveProgress(progress);

      const totalSegments = pathCoords.length - 1;
      const currentSegmentIndex = Math.min(
        totalSegments - 1,
        Math.floor(progress * totalSegments)
      );
      const segmentProgress = progress * totalSegments - currentSegmentIndex;

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
    <div className="flex flex-col space-y-3 h-[calc(100vh-125px)] min-h-[720px]">
      {/* 1. Global Navigation & Location Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-900/85 border border-slate-800 backdrop-blur-md">
        {/* Left: Brand & Title */}
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
              Draw any rectangle (small or large) across real streets to calculate shortest path routes
            </p>
          </div>
        </div>

        {/* Center: Prominent Location Search Box with Autocomplete */}
        <div className="relative flex-1 max-w-md min-w-[280px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLocationSearch();
            }}
            className="flex items-center bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-400/60 focus-within:border-cyan-400 rounded-xl px-3 py-1.5 shadow-inner transition-colors"
          >
            <Search className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search any location or street in Dhaka or worldwide..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              className="bg-transparent text-slate-100 text-xs focus:outline-none w-full font-mono placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
                className="text-slate-400 hover:text-white mr-1.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-mono font-extrabold uppercase transition-all shadow-sm"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSearchQuery(item.place_name);
                    handleLocationSearch(item.place_name);
                  }}
                  className="px-3 py-2 text-xs text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-200 cursor-pointer border-b border-slate-800/60 last:border-0 flex items-center space-x-2 transition-colors font-mono"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="truncate">{item.place_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Presets & Styles */}
        <div className="flex items-center space-x-2">
          {/* City Presets Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-950/70 border border-slate-800 rounded-xl px-2 py-1 text-xs">
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

          {/* Map Style Switcher */}
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                mapStyle.includes('dark')
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapStyle('mapbox://styles/mapbox/navigation-night-v1')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                mapStyle.includes('navigation')
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Night
            </button>
            <button
              onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                mapStyle.includes('satellite')
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Quick Location Tags */}
      <div className="flex items-center space-x-2 px-1 overflow-x-auto scrollbar-none py-0.5">
        <span className="text-[10px] uppercase font-mono text-slate-400 whitespace-nowrap flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Quick Fly:</span>
        </span>
        {POPULAR_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            onClick={() => {
              setSearchQuery(loc.query);
              handleLocationSearch(loc.query);
            }}
            className="px-2.5 py-0.5 rounded-full bg-slate-900/90 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[11px] font-mono whitespace-nowrap transition-all"
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* 2. Main Grid Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* Mapbox Canvas Viewport (8 Columns) */}
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-slate-800 bg-[#070b14] shadow-2xl flex flex-col">
          {/* Top Map Action Bar */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
            {/* Draw Rectangle Mode Button (Small rectangles accepted!) */}
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

            {/* Scan / Refresh Roads */}
            <button
              onClick={() => extractRoads(activeBbox)}
              disabled={isExtractingRoads}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono shadow-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isExtractingRoads ? 'animate-spin' : ''}`} />
              <span>RE-SCAN ROADS</span>
            </button>

            {/* Randomize Waypoints */}
            <button
              onClick={handleRandomizeWaypoints}
              className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono shadow-lg"
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
                <span>Drag any size box across streets — small blocks & intersections fully accepted!</span>
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
                  ? `${Math.round(
                      haversineDistanceMeters(
                        [activeBbox[0], activeBbox[1]],
                        [activeBbox[2], activeBbox[1]]
                      )
                    )}m × ${Math.round(
                      haversineDistanceMeters(
                        [activeBbox[0], activeBbox[1]],
                        [activeBbox[0], activeBbox[3]]
                      )
                    )}m`
                  : '0m'}
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
        <div className="lg:col-span-4 flex flex-col space-y-3 overflow-y-auto pr-1">
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
                      pickMode === 'START'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-emerald-400 hover:underline'
                    }`}
                  >
                    {pickMode === 'START' ? 'Click Map' : 'Pick on Map'}
                  </button>
                </label>
                <select
                  value={startNodeId}
                  onChange={(e) => {
                    setStartNodeId(e.target.value);
                    setRouteResult(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-emerald-300 font-mono truncate"
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
                      pickMode === 'TARGET'
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-rose-400 hover:underline'
                    }`}
                  >
                    {pickMode === 'TARGET' ? 'Click Map' : 'Pick on Map'}
                  </button>
                </label>
                <select
                  value={targetNodeId}
                  onChange={(e) => {
                    setTargetNodeId(e.target.value);
                    setRouteResult(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-rose-300 font-mono truncate"
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

          {/* 2. Vehicle Driving & Navigation Console */}
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
