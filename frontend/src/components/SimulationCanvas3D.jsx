import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSimulation } from '../context/SimulationContext';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Compass, 
  Eye, 
  RotateCcw, 
  Layers, 
  Car, 
  Siren, 
  Camera, 
  Trees, 
  Box, 
  Sun, 
  Moon, 
  Tag, 
  Info,
  X,
  Activity,
  Zap
} from 'lucide-react';

export default function SimulationCanvas3D({ onSelectNode, onSelectRoad, onSelectVehicle, onSwitchTo2D }) {
  const mountRef = useRef(null);
  const { 
    cityData, 
    simulationState, 
    activeRoute, 
    selectedVehicle, 
    selectedRoad, 
    selectedNode 
  } = useSimulation();

  // Fresh Refs for callbacks and data to avoid React stale closure in Three.js events
  const cityDataRef = useRef(cityData);
  const onSelectNodeRef = useRef(onSelectNode);
  const onSelectRoadRef = useRef(onSelectRoad);
  const onSelectVehicleRef = useRef(onSelectVehicle);

  useEffect(() => {
    cityDataRef.current = cityData;
    onSelectNodeRef.current = onSelectNode;
    onSelectRoadRef.current = onSelectRoad;
    onSelectVehicleRef.current = onSelectVehicle;
  });

  // Camera presets
  const [cameraMode, setCameraMode] = useState('isometric'); // 'isometric', 'topdown', 'street', 'chase'
  const [chaseVehicleId, setChaseVehicleId] = useState(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showParks, setShowParks] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isDaylight, setIsDaylight] = useState(true); // Bright high-contrast mode by default
  const [hoveredEntity, setHoveredEntity] = useState(null);

  // References to keep Three.js scene state stable across re-renders
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animIdRef = useRef(null);
  const lightsRef = useRef({});

  // Group containers for clean lifecycle & memory management
  const roadsGroupRef = useRef(new THREE.Group());
  const intersectionsGroupRef = useRef(new THREE.Group());
  const labelsGroupRef = useRef(new THREE.Group());
  const buildingsGroupRef = useRef(new THREE.Group());
  const parksGroupRef = useRef(new THREE.Group());
  const vehiclesGroupRef = useRef(new THREE.Group());
  const landmarksGroupRef = useRef(new THREE.Group());
  const routeGroupRef = useRef(new THREE.Group());
  const selectionGroupRef = useRef(new THREE.Group());

  // Dynamic mesh references
  const vehicleMeshesRef = useRef(new Map());
  const trafficLightBulbsRef = useRef(new Map());
  const landmarkBeaconsRef = useRef([]);

  // Local vehicle interpolation tracking
  const vehicleStatesRef = useRef(new Map());

  // Coordinate Conversion: 2D Grid (100..900, 100..700) -> 3D World (X, 0, Z)
  const to3DCoords = useCallback((x2d, y2d) => {
    return {
      x: (x2d - 500) * 0.55,
      z: (y2d - 400) * 0.55
    };
  }, []);

  // Helper: Deeply dispose Three.js group/mesh hierarchy
  const cleanGroup = (group) => {
    if (!group) return;
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      }
    }
  };

  // Helper: Distance from 2D point (px, pz) to line segment (x1, z1) -> (x2, z2)
  const distToSegment = (px, pz, x1, z1, x2, z2) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const l2 = dx * dx + dz * dz;
    if (l2 === 0) return Math.hypot(px - x1, pz - z1);
    let t = ((px - x1) * dx + (pz - z1) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projZ = z1 + t * dz;
    return Math.hypot(px - projX, pz - projZ);
  };

  // Helper: Generate crisp Canvas Text Sprite for floating node badges
  const createNodeSprite = (nodeId, name, type, isDay) => {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 112;
    const ctx = canvas.getContext('2d');

    const isHospital = type === 'HOSPITAL';
    const isFire = type === 'FIRE_STATION';
    const isPolice = type === 'POLICE_STATION';
    const isSpecial = isHospital || isFire || isPolice || type !== 'INTERSECTION';

    // Badge background
    ctx.fillStyle = isDay ? 'rgba(15, 23, 42, 0.90)' : 'rgba(2, 6, 23, 0.92)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 368, 96, 20);
    ctx.fill();

    // Border
    let borderColor = '#00f0ff';
    if (isHospital) borderColor = '#ef4444';
    else if (isFire) borderColor = '#f97316';
    else if (isPolice) borderColor = '#3b82f6';
    else if (!isDay) borderColor = '#38bdf8';

    ctx.lineWidth = isSpecial ? 4 : 2;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Node ID Pill
    ctx.fillStyle = borderColor;
    ctx.beginPath();
    ctx.roundRect(20, 24, 72, 34, 10);
    ctx.fill();

    ctx.font = 'bold 22px JetBrains Mono, monospace';
    ctx.fillStyle = '#020617';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nodeId, 56, 41);

    // Node Name
    ctx.font = isSpecial ? 'bold 21px Inter, sans-serif' : '19px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    const shortName = name.split(' (')[0];
    const truncatedName = shortName.length > 20 ? shortName.substring(0, 18) + '...' : shortName;
    ctx.fillText(truncatedName, 104, 42);

    // Subtitle / Type
    ctx.font = '15px JetBrains Mono, monospace';
    ctx.fillStyle = isSpecial ? borderColor : '#94a3b8';
    ctx.fillText(type.replace('_', ' '), 24, 82);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(18, 5.25, 1);
    return sprite;
  };

  // 1. Initialize Three.js Scene, Camera, Renderer, Controls & Event Listeners
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Attach managed groups to scene
    scene.add(roadsGroupRef.current);
    scene.add(intersectionsGroupRef.current);
    scene.add(labelsGroupRef.current);
    scene.add(buildingsGroupRef.current);
    scene.add(parksGroupRef.current);
    scene.add(vehiclesGroupRef.current);
    scene.add(landmarksGroupRef.current);
    scene.add(routeGroupRef.current);
    scene.add(selectionGroupRef.current);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3500);
    camera.position.set(0, 280, 310);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Prevent camera dipping under floor
    controls.minDistance = 20;
    controls.maxDistance = 850;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting (Bright & Visible)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.6);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.6);
    dirLight.position.set(220, 500, 220);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 50;
    dirLight.shadow.camera.far = 900;
    const d = 340;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    lightsRef.current = { ambientLight, hemiLight, dirLight };

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(1600, 1600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x182234,
      roughness: 0.6,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ground Gridlines
    const gridHelper = new THREE.GridHelper(1000, 50, 0x38bdf8, 0x334155);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Accurate Raycasting with Drag Threshold Check
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e) => {
      // If user dragged to rotate or pan camera (delta > 6px), ignore click
      const dragDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dragDist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // 1. Check Intersection Nodes (Disc or Click Zone or Label)
      const intersectionHits = raycaster.intersectObjects(intersectionsGroupRef.current.children, true);
      if (intersectionHits.length > 0) {
        let hitObj = intersectionHits[0].object;
        while (hitObj && !hitObj.userData?.nodeId && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        if (hitObj?.userData?.nodeId) {
          const currentCity = cityDataRef.current;
          const node = currentCity?.intersections?.find(n => n.id === hitObj.userData.nodeId);
          if (node && onSelectNodeRef.current) {
            onSelectNodeRef.current(node);
            return;
          }
        }
      }

      // 2. Check Vehicles
      const vehicleHits = raycaster.intersectObjects(vehiclesGroupRef.current.children, true);
      if (vehicleHits.length > 0) {
        let hitObj = vehicleHits[0].object;
        while (hitObj && !hitObj.userData?.vehicleId && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        if (hitObj?.userData?.vehicleId) {
          const currentCity = cityDataRef.current;
          const veh = currentCity?.vehicles?.find(v => v.id === hitObj.userData.vehicleId);
          if (veh && onSelectVehicleRef.current) {
            onSelectVehicleRef.current(veh);
            return;
          }
        }
      }

      // 3. Check Roads
      const roadHits = raycaster.intersectObjects(roadsGroupRef.current.children, true);
      if (roadHits.length > 0) {
        let hitObj = roadHits[0].object;
        while (hitObj && !hitObj.userData?.roadId && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        if (hitObj?.userData?.roadId) {
          const currentCity = cityDataRef.current;
          const road = currentCity?.roads?.find(r => r.id === hitObj.userData.roadId);
          if (road && onSelectRoadRef.current) {
            onSelectRoadRef.current(road);
            return;
          }
        }
      }
    };

    // Pointer Move for Hover Feedback
    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const hitNodes = raycaster.intersectObjects(intersectionsGroupRef.current.children, true);
      const hitVehicles = raycaster.intersectObjects(vehiclesGroupRef.current.children, true);
      const hitRoads = raycaster.intersectObjects(roadsGroupRef.current.children, true);

      if (hitNodes.length > 0 || hitVehicles.length > 0 || hitRoads.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        if (hitNodes.length > 0) {
          const nId = hitNodes[0].object.userData?.nodeId;
          const node = cityDataRef.current?.intersections?.find(n => n.id === nId);
          if (node) setHoveredEntity({ type: 'NODE', data: node });
        } else if (hitVehicles.length > 0) {
          const vId = hitVehicles[0].object.userData?.vehicleId;
          const veh = cityDataRef.current?.vehicles?.find(v => v.id === vId);
          if (veh) setHoveredEntity({ type: 'VEHICLE', data: veh });
        } else if (hitRoads.length > 0) {
          const rId = hitRoads[0].object.userData?.roadId;
          const road = cityDataRef.current?.roads?.find(r => r.id === rId);
          if (road) setHoveredEntity({ type: 'ROAD', data: road });
        }
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredEntity(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      controls.update();

      // Animate 3D Landmark holographic beacons
      landmarkBeaconsRef.current.forEach(beacon => {
        if (beacon) {
          beacon.rotation.y += delta * 1.5;
          beacon.position.y = beacon.userData.baseY + Math.sin(time * 3) * 1.2;
        }
      });

      // Animate 3D vehicles
      updateVehiclePositions(delta, time);

      // Chase Camera Update
      if (cameraMode === 'chase' && chaseVehicleId) {
        const vMesh = vehicleMeshesRef.current.get(chaseVehicleId);
        if (vMesh?.group) {
          const targetPos = vMesh.group.position;
          const targetRot = vMesh.group.rotation.y;

          const offset = new THREE.Vector3(
            Math.sin(targetRot) * -38,
            20,
            Math.cos(targetRot) * -38
          );
          camera.position.lerp(targetPos.clone().add(offset), 0.1);
          controls.target.lerp(targetPos, 0.15);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Theme Lighting & Background
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (isDaylight) {
      // High-Visibility Bright Daylight Palette
      scene.background = new THREE.Color(0x131d2e);
      scene.fog = new THREE.FogExp2(0x131d2e, 0.0012);

      if (lightsRef.current.ambientLight) lightsRef.current.ambientLight.intensity = 2.4;
      if (lightsRef.current.hemiLight) lightsRef.current.hemiLight.intensity = 1.8;
      if (lightsRef.current.dirLight) {
        lightsRef.current.dirLight.color.setHex(0xffffff);
        lightsRef.current.dirLight.intensity = 2.8;
      }
    } else {
      // Cyber Night Mode
      scene.background = new THREE.Color(0x060a12);
      scene.fog = new THREE.FogExp2(0x060a12, 0.0018);

      if (lightsRef.current.ambientLight) lightsRef.current.ambientLight.intensity = 1.6;
      if (lightsRef.current.hemiLight) lightsRef.current.hemiLight.intensity = 1.0;
      if (lightsRef.current.dirLight) {
        lightsRef.current.dirLight.color.setHex(0xa5f3fc);
        lightsRef.current.dirLight.intensity = 2.0;
      }
    }
  }, [isDaylight]);

  // Update 3D Camera Modes
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (cameraMode === 'isometric') {
      camera.position.set(0, 270, 300);
      controls.target.set(0, 0, 0);
    } else if (cameraMode === 'topdown') {
      camera.position.set(0, 440, 0.1);
      controls.target.set(0, 0, 0);
    } else if (cameraMode === 'street') {
      camera.position.set(0, 22, 110);
      controls.target.set(0, 8, 0);
    }
  }, [cameraMode]);

  // 2. Build 3D Roads, Intersections, Labels, Landmarks & Collision-Free Buildings
  useEffect(() => {
    if (!cityData?.intersections || !cityData?.roads) return;

    // Clean up existing architecture
    cleanGroup(roadsGroupRef.current);
    cleanGroup(intersectionsGroupRef.current);
    cleanGroup(labelsGroupRef.current);
    cleanGroup(buildingsGroupRef.current);
    cleanGroup(parksGroupRef.current);
    cleanGroup(landmarksGroupRef.current);
    landmarkBeaconsRef.current = [];
    trafficLightBulbsRef.current.clear();

    const nodeMap = new Map();
    const allNodes3D = [];
    cityData.intersections.forEach(n => {
      const pos3D = to3DCoords(n.x, n.y);
      const data = { ...n, pos3D };
      nodeMap.set(n.id, data);
      allNodes3D.push({ id: n.id, x: pos3D.x, z: pos3D.z, radius: 9.0 });
    });

    // 1. Build 3D Road Meshes
    const roadMatAsphalt = new THREE.MeshStandardMaterial({
      color: isDaylight ? 0x222f3e : 0x111827,
      roughness: 0.65,
      metalness: 0.25,
    });

    const uniqueRoads = new Set();
    const allRoadSegments3D = [];
    const roadWidth = 9.4;

    cityData.roads.forEach(road => {
      const pairKey = [road.sourceNodeId, road.targetNodeId].sort().join('--');
      if (uniqueRoads.has(pairKey)) return;
      uniqueRoads.add(pairKey);

      const u = nodeMap.get(road.sourceNodeId);
      const v = nodeMap.get(road.targetNodeId);
      if (!u || !v) return;

      const dx = v.pos3D.x - u.pos3D.x;
      const dz = v.pos3D.z - u.pos3D.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      allRoadSegments3D.push({
        x1: u.pos3D.x,
        z1: u.pos3D.z,
        x2: v.pos3D.x,
        z2: v.pos3D.z,
        width: roadWidth
      });

      // Main Road Asphalt Slab
      const roadGeo = new THREE.BoxGeometry(length, 0.35, roadWidth);
      const roadMesh = new THREE.Mesh(roadGeo, roadMatAsphalt);
      roadMesh.position.set((u.pos3D.x + v.pos3D.x) / 2, 0.17, (u.pos3D.z + v.pos3D.z) / 2);
      roadMesh.rotation.y = -angle;
      roadMesh.receiveShadow = true;
      roadMesh.userData = { roadId: road.id };
      roadsGroupRef.current.add(roadMesh);

      // Traffic Glow Edges / Curbs
      let trafficColor = 0x10b981; // Low (Emerald)
      if (road.trafficLevel === 'MEDIUM') trafficColor = 0xf59e0b;
      if (road.trafficLevel === 'HIGH') trafficColor = 0xf97316;
      if (road.trafficLevel === 'CRITICAL') trafficColor = 0xef4444;
      if (road.blocked) trafficColor = 0xff0033;

      const curbGeo = new THREE.BoxGeometry(length, 0.42, 0.65);
      const curbMat = new THREE.MeshBasicMaterial({
        color: trafficColor,
        transparent: true,
        opacity: road.blocked ? 0.95 : 0.75
      });

      const curbL = new THREE.Mesh(curbGeo, curbMat);
      curbL.position.set(0, 0.08, -roadWidth / 2 + 0.32);
      roadMesh.add(curbL);

      const curbR = new THREE.Mesh(curbGeo, curbMat);
      curbR.position.set(0, 0.08, roadWidth / 2 - 0.32);
      roadMesh.add(curbR);

      // Center Bright White Dashed Line (raised properly to prevent Z-fighting)
      const dashGeo = new THREE.PlaneGeometry(length * 0.94, 0.38);
      const dashMat = new THREE.MeshBasicMaterial({
        color: road.blocked ? 0xef4444 : 0xf8fafc,
        transparent: true,
        opacity: 0.8
      });
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.y = 0.22;
      roadMesh.add(dash);

      // Blocked Road 3D Animated Barricades
      if (road.blocked) {
        const barrierGroup = new THREE.Group();
        const postGeo = new THREE.BoxGeometry(1.0, 3.2, 7.5);
        const postMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          roughness: 0.3,
          emissive: 0x7f1d1d,
          emissiveIntensity: 0.8
        });
        const barrierMesh = new THREE.Mesh(postGeo, postMat);
        barrierMesh.position.y = 1.6;
        barrierGroup.add(barrierMesh);

        const warnLight = new THREE.PointLight(0xff0033, 3.0, 25);
        warnLight.position.set(0, 3.5, 0);
        barrierGroup.add(warnLight);

        roadMesh.add(barrierGroup);
      }
    });

    // 2. Build 3D Intersections & Functional Traffic Lights & Floating Text Badges
    cityData.intersections.forEach(node => {
      const pos = nodeMap.get(node.id).pos3D;

      // Intersection Pavement Disc
      const discGeo = new THREE.CylinderGeometry(8.5, 8.5, 0.4, 24);
      const discMat = new THREE.MeshStandardMaterial({
        color: isDaylight ? 0x1e293b : 0x0f172a,
        roughness: 0.6
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.set(pos.x, 0.20, pos.z);
      disc.receiveShadow = true;
      disc.userData = { nodeId: node.id };
      intersectionsGroupRef.current.add(disc);

      // Outer Traffic Status Ring
      const ringGeo = new THREE.RingGeometry(8.0, 8.7, 24);
      let ringColor = 0x22c55e;
      if (node.trafficLightState === 'YELLOW') ringColor = 0xeab308;
      if (node.trafficLightState === 'RED') ringColor = 0xef4444;
      if (node.emergencyOverride) ringColor = 0x00f0ff;

      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pos.x, 0.42, pos.z);
      intersectionsGroupRef.current.add(ring);

      // Invisible Click Hit Zone for easy raycasting from any camera angle
      const hitZone = new THREE.Mesh(
        new THREE.CylinderGeometry(9.0, 9.0, 24.0, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitZone.position.set(pos.x, 12.0, pos.z);
      hitZone.userData = { nodeId: node.id };
      intersectionsGroupRef.current.add(hitZone);

      // Floating 3D Text Billboard Sprite Badge
      if (showLabels) {
        const sprite = createNodeSprite(node.id, node.name, node.type, isDaylight);
        sprite.position.set(pos.x, 16.5, pos.z);
        sprite.userData = { nodeId: node.id };
        labelsGroupRef.current.add(sprite);
      }

      // 3D Traffic Light Post
      const postGeo = new THREE.CylinderGeometry(0.28, 0.28, 9.5, 8);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(pos.x + 5.5, 4.75, pos.z + 5.5);
      intersectionsGroupRef.current.add(post);

      // Traffic Signal Housing
      const headGeo = new THREE.BoxGeometry(0.85, 2.7, 0.85);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x020617 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(pos.x + 5.5, 8.7, pos.z + 5.5);
      intersectionsGroupRef.current.add(head);

      // LED Light Bulbs (Red, Yellow, Green)
      const bulbGeo = new THREE.SphereGeometry(0.3, 12, 12);

      const redBulbMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: node.trafficLightState === 'RED' ? 0xef4444 : 0x220505,
        emissiveIntensity: node.trafficLightState === 'RED' ? 3.0 : 0.2
      });
      const redBulb = new THREE.Mesh(bulbGeo, redBulbMat);
      redBulb.position.set(pos.x + 5.5, 9.5, pos.z + 6.0);
      intersectionsGroupRef.current.add(redBulb);

      const yellowBulbMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        emissive: node.trafficLightState === 'YELLOW' ? 0xeab308 : 0x221a02,
        emissiveIntensity: node.trafficLightState === 'YELLOW' ? 3.0 : 0.2
      });
      const yellowBulb = new THREE.Mesh(bulbGeo, yellowBulbMat);
      yellowBulb.position.set(pos.x + 5.5, 8.7, pos.z + 6.0);
      intersectionsGroupRef.current.add(yellowBulb);

      const greenBulbMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: node.trafficLightState === 'GREEN' ? 0x22c55e : 0x022209,
        emissiveIntensity: node.trafficLightState === 'GREEN' ? 3.0 : 0.2
      });
      const greenBulb = new THREE.Mesh(bulbGeo, greenBulbMat);
      greenBulb.position.set(pos.x + 5.5, 7.9, pos.z + 6.0);
      intersectionsGroupRef.current.add(greenBulb);

      trafficLightBulbsRef.current.set(node.id, { redBulbMat, yellowBulbMat, greenBulbMat, ringMat });

      // Specialized 3D Landmark Holographic Beacons
      if (node.type === 'HOSPITAL') {
        const crossGroup = new THREE.Group();
        const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.0, 1.2), crossMat);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.6, 1.2), crossMat);
        crossGroup.add(crossV);
        crossGroup.add(crossH);
        crossGroup.position.set(pos.x, 25, pos.z);
        crossGroup.userData = { baseY: 25 };
        landmarksGroupRef.current.add(crossGroup);
        landmarkBeaconsRef.current.push(crossGroup);
      } else if (node.type === 'FIRE_STATION') {
        const flameGeo = new THREE.ConeGeometry(2.5, 6.5, 5);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(pos.x, 23, pos.z);
        flame.userData = { baseY: 23 };
        landmarksGroupRef.current.add(flame);
        landmarkBeaconsRef.current.push(flame);
      } else if (node.type === 'POLICE_STATION') {
        const shieldGeo = new THREE.OctahedronGeometry(3.0);
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.set(pos.x, 23, pos.z);
        shield.userData = { baseY: 23 };
        landmarksGroupRef.current.add(shield);
        landmarkBeaconsRef.current.push(shield);
      }
    });

    // 3. Collision-Safe Procedural Skyline & Urban Parks Generator
    if (showBuildings) {
      buildCollisionFreeCity(allRoadSegments3D, allNodes3D);
    }
  }, [cityData?.intersections, cityData?.roads, showBuildings, showParks, showLabels, isDaylight, to3DCoords]);

  // Procedural Collision-Free City Generator
  const buildCollisionFreeCity = (roadSegments, nodes) => {
    const isSafePosition = (x, z, radius) => {
      for (const seg of roadSegments) {
        const dist = distToSegment(x, z, seg.x1, seg.z1, seg.x2, seg.z2);
        if (dist < (seg.width / 2 + radius + 4.0)) {
          return false;
        }
      }
      for (const node of nodes) {
        const dist = Math.hypot(x - node.x, z - node.z);
        if (dist < (node.radius + radius + 4.8)) {
          return false;
        }
      }
      return true;
    };

    // Shared Materials
    const darkTowerMat = new THREE.MeshStandardMaterial({
      color: isDaylight ? 0x334155 : 0x090e1c,
      roughness: 0.35,
      metalness: 0.65
    });

    const glassTowerMat = new THREE.MeshStandardMaterial({
      color: isDaylight ? 0x1e3a8a : 0x0f2042,
      roughness: 0.1,
      metalness: 0.9,
      emissive: isDaylight ? 0x172554 : 0x071530,
      emissiveIntensity: 0.7
    });

    const residentialMat = new THREE.MeshStandardMaterial({
      color: isDaylight ? 0x475569 : 0x162035,
      roughness: 0.5,
      metalness: 0.4
    });

    const antennaMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const parkGrassMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });

    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        const xMin = -220 + c * 110;
        const xMax = xMin + 110;
        const zMin = -165 + r * 82.5;
        const zMax = zMin + 82.5;

        const subPlots = [
          { rx: 0.28, rz: 0.28, baseH: 48, w: 15, d: 15, style: 'skyscraper' },
          { rx: 0.72, rz: 0.28, baseH: 38, w: 14, d: 14, style: 'commercial' },
          { rx: 0.28, rz: 0.72, baseH: 42, w: 14, d: 14, style: 'residential' },
          { rx: 0.72, rz: 0.72, baseH: 58, w: 16, d: 16, style: 'skyscraper' },
          { rx: 0.50, rz: 0.50, baseH: 65, w: 18, d: 18, style: 'corporate_hq' },
        ];

        let buildingsInParcel = 0;

        subPlots.forEach((p, idx) => {
          const posX = xMin + (xMax - xMin) * p.rx;
          const posZ = zMin + (zMax - zMin) * p.rz;
          const bRadius = Math.max(p.w, p.d) / 2;

          if (isSafePosition(posX, posZ, bRadius)) {
            buildingsInParcel++;
            const height = p.baseH + ((c * 17 + r * 23 + idx * 11) % 45);

            const bGeo = new THREE.BoxGeometry(p.w, height, p.d);
            let bMat = darkTowerMat;
            if (p.style === 'skyscraper' || p.style === 'corporate_hq') {
              bMat = height > 60 ? glassTowerMat : darkTowerMat;
            } else if (p.style === 'residential') {
              bMat = residentialMat;
            }

            const building = new THREE.Mesh(bGeo, bMat);
            building.position.set(posX, height / 2, posZ);
            building.castShadow = true;
            building.receiveShadow = true;
            buildingsGroupRef.current.add(building);

            // Illuminated window accent strips
            if (height > 45) {
              const stripeGeo = new THREE.BoxGeometry(p.w + 0.15, 0.9, p.d + 0.15);
              const stripeMat = new THREE.MeshBasicMaterial({
                color: (idx % 2 === 0) ? 0x00f0ff : 0x38bdf8,
                transparent: true,
                opacity: 0.8
              });
              const stripe = new THREE.Mesh(stripeGeo, stripeMat);
              stripe.position.set(posX, height * 0.75, posZ);
              buildingsGroupRef.current.add(stripe);
            }

            // Rooftop Antenna & Beacon
            if (height > 55) {
              const antennaGeo = new THREE.CylinderGeometry(0.2, 0.2, 9, 6);
              const antenna = new THREE.Mesh(antennaGeo, antennaMat);
              antenna.position.set(posX, height + 4.5, posZ);
              buildingsGroupRef.current.add(antenna);

              const beaconGeo = new THREE.SphereGeometry(0.38, 8, 8);
              const beacon = new THREE.Mesh(beaconGeo, redBeaconMat);
              beacon.position.set(posX, height + 9.2, posZ);
              buildingsGroupRef.current.add(beacon);
            }
          }
        });

        // Landscaped park plaza in parcels cut by expressways
        if (showParks && buildingsInParcel <= 2) {
          const parkX = (xMin + xMax) / 2;
          const parkZ = (zMin + zMax) / 2;
          const parkRadius = 10;

          if (isSafePosition(parkX, parkZ, parkRadius)) {
            const parkGeo = new THREE.BoxGeometry(20, 0.1, 16);
            const parkMesh = new THREE.Mesh(parkGeo, parkGrassMat);
            parkMesh.position.set(parkX, 0.08, parkZ);
            parkMesh.receiveShadow = true;
            parksGroupRef.current.add(parkMesh);

            const treeOffsets = [
              { dx: -6, dz: -4 },
              { dx: 6, dz: -4 },
              { dx: -5, dz: 4 },
              { dx: 5, dz: 4 },
              { dx: 0, dz: 0 },
            ];

            treeOffsets.forEach(to => {
              const tx = parkX + to.dx;
              const tz = parkZ + to.dz;
              if (isSafePosition(tx, tz, 2.0)) {
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.5, 6), treeTrunkMat);
                trunk.position.set(tx, 1.25, tz);
                parksGroupRef.current.add(trunk);

                const foliage = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.5, 7), treeFoliageMat);
                foliage.position.set(tx, 4.2, tz);
                foliage.castShadow = true;
                parksGroupRef.current.add(foliage);
              }
            });
          }
        }
      }
    }
  };

  // 3. Update Dynamic 3D A* Route Tube
  useEffect(() => {
    cleanGroup(routeGroupRef.current);

    if (!activeRoute || !activeRoute.nodeIds || activeRoute.nodeIds.length < 2 || !cityData?.intersections) {
      return;
    }

    const nodeMap = new Map();
    cityData.intersections.forEach(n => nodeMap.set(n.id, to3DCoords(n.x, n.y)));

    const points = [];
    activeRoute.nodeIds.forEach(id => {
      const pos = nodeMap.get(id);
      if (pos) {
        points.push(new THREE.Vector3(pos.x, 2.6, pos.z));
      }
    });

    if (points.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 72, 1.4, 8, false);

      const isEmergency = activeRoute.strategy?.toLowerCase().includes('emergency');
      const tubeColor = isEmergency ? 0xff0055 : 0x00f0ff;

      const tubeMat = new THREE.MeshBasicMaterial({
        color: tubeColor,
        transparent: true,
        opacity: 0.88
      });

      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      routeGroupRef.current.add(tube);
    }
  }, [activeRoute, cityData?.intersections, to3DCoords]);

  // 4. Update Selection Reticle
  useEffect(() => {
    cleanGroup(selectionGroupRef.current);

    if (selectedVehicle) {
      const vState = vehicleStatesRef.current.get(selectedVehicle.id);
      if (vState) {
        const ringGeo = new THREE.RingGeometry(5.0, 5.8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(vState.currentX, 0.4, vState.currentZ);
        selectionGroupRef.current.add(ring);
      }
    } else if (selectedNode) {
      const pos = to3DCoords(selectedNode.x, selectedNode.y);
      const ringGeo = new THREE.RingGeometry(10.0, 11.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pos.x, 0.45, pos.z);
      selectionGroupRef.current.add(ring);
    } else if (selectedRoad && cityData?.intersections) {
      const u = cityData.intersections.find(n => n.id === selectedRoad.sourceNodeId);
      const v = cityData.intersections.find(n => n.id === selectedRoad.targetNodeId);
      if (u && v) {
        const p1 = to3DCoords(u.x, u.y);
        const p2 = to3DCoords(v.x, v.y);
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dz, dx);

        const borderGeo = new THREE.BoxGeometry(len, 0.6, 10.4);
        const borderMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          transparent: true,
          opacity: 0.8
        });
        const mesh = new THREE.Mesh(borderGeo, borderMat);
        mesh.position.set((p1.x + p2.x) / 2, 0.35, (p1.z + p2.z) / 2);
        mesh.rotation.y = -angle;
        selectionGroupRef.current.add(mesh);
      }
    }
  }, [selectedVehicle, selectedNode, selectedRoad, cityData?.intersections, to3DCoords]);

  // 5. Update Traffic Light Signal States
  useEffect(() => {
    if (!cityData?.intersections) return;
    cityData.intersections.forEach(node => {
      const bulbs = trafficLightBulbsRef.current.get(node.id);
      if (!bulbs) return;

      const state = node.trafficLightState;
      bulbs.redBulbMat.emissive.setHex(state === 'RED' ? 0xef4444 : 0x220505);
      bulbs.redBulbMat.emissiveIntensity = state === 'RED' ? 3.0 : 0.2;

      bulbs.yellowBulbMat.emissive.setHex(state === 'YELLOW' ? 0xeab308 : 0x221a02);
      bulbs.yellowBulbMat.emissiveIntensity = state === 'YELLOW' ? 3.0 : 0.2;

      bulbs.greenBulbMat.emissive.setHex(state === 'GREEN' ? 0x22c55e : 0x022209);
      bulbs.greenBulbMat.emissiveIntensity = state === 'GREEN' ? 3.0 : 0.2;

      let ringColor = 0x22c55e;
      if (state === 'YELLOW') ringColor = 0xeab308;
      if (state === 'RED') ringColor = 0xef4444;
      if (node.emergencyOverride) ringColor = 0x00f0ff;
      bulbs.ringMat.color.setHex(ringColor);
    });
  }, [cityData?.intersections]);

  // 6. Sync and Interpolate 3D Vehicles
  useEffect(() => {
    if (!cityData?.vehicles) return;
    const now = performance.now();

    cityData.vehicles.forEach(v => {
      const pos3d = to3DCoords(v.x, v.y);
      const prev = vehicleStatesRef.current.get(v.id);

      if (prev) {
        prev.startX = prev.currentX;
        prev.startZ = prev.currentZ;
        prev.targetX = pos3d.x;
        prev.targetZ = pos3d.z;
        prev.startTime = now;
        prev.speed = v.speed;
        prev.status = v.status;
        prev.type = v.type;
      } else {
        vehicleStatesRef.current.set(v.id, {
          currentX: pos3d.x,
          currentZ: pos3d.z,
          startX: pos3d.x,
          startZ: pos3d.z,
          targetX: pos3d.x,
          targetZ: pos3d.z,
          heading: 0,
          startTime: now,
          speed: v.speed,
          status: v.status,
          type: v.type
        });
      }

      // Create 3D vehicle mesh if not existing
      if (!vehicleMeshesRef.current.has(v.id)) {
        const vMesh = create3DVehicleMesh(v);
        vMesh.group.userData = { vehicleId: v.id };
        vehiclesGroupRef.current.add(vMesh.group);
        vehicleMeshesRef.current.set(v.id, vMesh);
      }
    });

    // Remove deleted vehicles
    const activeIds = new Set(cityData.vehicles.map(v => v.id));
    for (let [id, vMesh] of vehicleMeshesRef.current.entries()) {
      if (!activeIds.has(id)) {
        vehiclesGroupRef.current.remove(vMesh.group);
        cleanGroup(vMesh.group);
        vehicleMeshesRef.current.delete(id);
        vehicleStatesRef.current.delete(id);
      }
    }
  }, [cityData?.vehicles, to3DCoords]);

  // Procedural 3D Vehicle Mesh Creator
  const create3DVehicleMesh = (vehicle) => {
    const group = new THREE.Group();
    const isAmbulance = vehicle.type === 'AMBULANCE';
    const isFireTruck = vehicle.type === 'FIRE_TRUCK';
    const isPolice = vehicle.type === 'POLICE';

    let bodyMesh;
    let strobeLights = [];

    if (isAmbulance) {
      // Ambulance Van
      const bodyGeo = new THREE.BoxGeometry(4.8, 2.4, 2.2);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
      bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 1.4;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const stripeGeo = new THREE.BoxGeometry(4.85, 0.6, 2.22);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = 1.3;
      group.add(stripe);

      const strobeL = new THREE.PointLight(0xef4444, 3.5, 25);
      strobeL.position.set(-1.2, 2.8, 0);
      group.add(strobeL);
      strobeLights.push({ light: strobeL, baseColor: 0xef4444 });

      const strobeR = new THREE.PointLight(0x3b82f6, 3.5, 25);
      strobeR.position.set(1.2, 2.8, 0);
      group.add(strobeR);
      strobeLights.push({ light: strobeR, baseColor: 0x3b82f6 });
    } else if (isFireTruck) {
      // Fire Truck Heavy Body
      const bodyGeo = new THREE.BoxGeometry(7.0, 2.8, 2.5);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
      bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 1.6;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const ladderGeo = new THREE.BoxGeometry(5.0, 0.4, 1.2);
      const ladderMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const ladder = new THREE.Mesh(ladderGeo, ladderMat);
      ladder.position.y = 3.2;
      group.add(ladder);

      const beacon = new THREE.PointLight(0xf59e0b, 4.0, 30);
      beacon.position.set(2.0, 3.5, 0);
      group.add(beacon);
      strobeLights.push({ light: beacon, baseColor: 0xf59e0b });
    } else if (isPolice) {
      // Police Cruiser
      const bodyGeo = new THREE.BoxGeometry(4.4, 1.6, 2.0);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2 });
      bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 1.0;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const doorGeo = new THREE.BoxGeometry(2.0, 1.4, 2.05);
      const doorMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const doors = new THREE.Mesh(doorGeo, doorMat);
      doors.position.y = 1.0;
      group.add(doors);

      const lightbarRed = new THREE.PointLight(0xef4444, 3.5, 25);
      lightbarRed.position.set(0, 2.0, -0.6);
      group.add(lightbarRed);
      strobeLights.push({ light: lightbarRed, baseColor: 0xef4444 });

      const lightbarBlue = new THREE.PointLight(0x3b82f6, 3.5, 25);
      lightbarBlue.position.set(0, 2.0, 0.6);
      group.add(lightbarBlue);
      strobeLights.push({ light: lightbarBlue, baseColor: 0x3b82f6 });
    } else {
      // Civilian Sedan Car
      const carColors = [0x0284c7, 0x10b981, 0x8b5cf6, 0xf59e0b, 0xec4899];
      const colorIndex = Math.abs(vehicle.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % carColors.length;

      const bodyGeo = new THREE.BoxGeometry(3.8, 1.3, 1.8);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: carColors[colorIndex],
        roughness: 0.3,
        metalness: 0.5
      });
      bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.9;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const glassGeo = new THREE.BoxGeometry(2.0, 0.8, 1.6);
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a192f, roughness: 0.1, metalness: 0.9 });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(-0.2, 1.6, 0);
      group.add(glass);
    }

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 });
    const wheelPositions = [
      { x: -1.4, z: -1.0 },
      { x: 1.4, z: -1.0 },
      { x: -1.4, z: 1.0 },
      { x: 1.4, z: 1.0 },
    ];
    wheelPositions.forEach(wp => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wp.x, 0.5, wp.z);
      group.add(wheel);
    });

    // Headlights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const hlGeo = new THREE.BoxGeometry(0.1, 0.3, 0.4);
    const hlL = new THREE.Mesh(hlGeo, headlightMat);
    hlL.position.set(2.0, 0.8, -0.6);
    group.add(hlL);

    const hlR = new THREE.Mesh(hlGeo, headlightMat);
    hlR.position.set(2.0, 0.8, 0.6);
    group.add(hlR);

    // Taillights
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tlL = new THREE.Mesh(hlGeo, tailLightMat);
    tlL.position.set(-2.0, 0.8, -0.6);
    group.add(tlL);

    const tlR = new THREE.Mesh(hlGeo, tailLightMat);
    tlR.position.set(-2.0, 0.8, 0.6);
    group.add(tlR);

    return { group, strobeLights, vehicleId: vehicle.id };
  };

  // Interpolate 3D Vehicle Positions smoothly
  const updateVehiclePositions = (delta, time) => {
    const now = performance.now();

    vehicleStatesRef.current.forEach((vState, id) => {
      const vMesh = vehicleMeshesRef.current.get(id);
      if (!vMesh) return;

      const elapsed = (now - vState.startTime) / 1000;
      const t = Math.min(1.0, elapsed / 0.85);

      const curX = vState.startX + (vState.targetX - vState.startX) * t;
      const curZ = vState.startZ + (vState.targetZ - vState.startZ) * t;
      vState.currentX = curX;
      vState.currentZ = curZ;

      vMesh.group.position.set(curX, 0, curZ);

      // Directional Heading Angle
      const dx = vState.targetX - vState.startX;
      const dz = vState.targetZ - vState.startZ;
      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        const headingAngle = Math.atan2(dz, dx);
        vState.heading = -headingAngle;
        vMesh.group.rotation.y = -headingAngle;
      } else if (vState.heading !== undefined) {
        vMesh.group.rotation.y = vState.heading;
      }

      // Flash emergency strobe lights
      if (vMesh.strobeLights.length > 0) {
        const flash = Math.sin(time * 18);
        vMesh.strobeLights.forEach((strobe, idx) => {
          strobe.light.intensity = ((idx === 0 && flash > 0) || (idx === 1 && flash < 0)) ? 4.5 : 0.2;
        });
      }
    });
  };

  // Lock camera to first active emergency vehicle
  const triggerChaseCam = () => {
    const emergencyVeh = cityData?.vehicles?.find(v => v.type !== 'CAR' && v.status === 'EN_ROUTE');
    if (emergencyVeh) {
      setChaseVehicleId(emergencyVeh.id);
      setCameraMode('chase');
    } else if (cityData?.vehicles?.[0]) {
      setChaseVehicleId(cityData.vehicles[0].id);
      setCameraMode('chase');
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#0c1322] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

      {/* Top Left Camera Modes HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-xl text-xs">
          <button
            onClick={() => setCameraMode('isometric')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              cameraMode === 'isometric' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Isometric 3D</span>
          </button>
          <button
            onClick={() => setCameraMode('topdown')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              cameraMode === 'topdown' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Tactical 90°</span>
          </button>
          <button
            onClick={() => setCameraMode('street')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              cameraMode === 'street' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Street View</span>
          </button>
          <button
            onClick={triggerChaseCam}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              cameraMode === 'chase' ? 'bg-red-500/25 text-red-300 border border-red-500/50 font-bold animate-pulse' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            <span>Chase Cam</span>
          </button>
        </div>
      </div>

      {/* Top Right Controls & Layer Toggles */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        {/* Switch to 2D Mode */}
        {onSwitchTo2D && (
          <button
            onClick={onSwitchTo2D}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-cyan-500/50 text-cyan-300 font-mono font-bold text-xs shadow-xl transition-all"
          >
            <Box className="w-3.5 h-3.5" />
            <span>2D Tactical Grid</span>
          </button>
        )}

        {/* Day / Night Theme Toggle */}
        <button
          onClick={() => setIsDaylight(!isDaylight)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-mono font-bold transition-all shadow-xl ${
            isDaylight 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30' 
              : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/80'
          }`}
          title="Toggle High-Visibility Daylight / Cyber Night mode"
        >
          {isDaylight ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
          <span>{isDaylight ? 'Daylight' : 'Night'}</span>
        </button>

        {/* Data Labels Toggle */}
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border text-xs transition-all shadow-xl ${
            showLabels ? 'border-cyan-500/40 text-cyan-300 font-bold' : 'border-slate-700 text-slate-400 hover:text-white'
          }`}
          title="Toggle 3D Junction and Landmark Data Labels"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Labels</span>
        </button>

        {/* Skyscrapers Toggle */}
        <button
          onClick={() => setShowBuildings(!showBuildings)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border text-xs transition-all shadow-xl ${
            showBuildings ? 'border-cyan-500/40 text-cyan-300 font-bold' : 'border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Skyline</span>
        </button>

        {/* Parks Toggle */}
        <button
          onClick={() => setShowParks(!showParks)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border text-xs transition-all shadow-xl ${
            showParks ? 'border-emerald-500/40 text-emerald-300 font-bold' : 'border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Trees className="w-3.5 h-3.5" />
          <span>Parks</span>
        </button>
      </div>

      {/* Selected Entity Card HUD */}
      {(selectedNode || selectedRoad || selectedVehicle) && (
        <div className="absolute top-16 left-4 z-20 max-w-sm p-3 rounded-xl bg-slate-900/95 backdrop-blur-lg border border-cyan-500/40 shadow-2xl text-xs space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-mono font-bold text-cyan-400 uppercase flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>
                {selectedNode ? `Junction ${selectedNode.id}` : selectedRoad ? `Road ${selectedRoad.id}` : `Vehicle ${selectedVehicle.id}`}
              </span>
            </span>
            <button
              onClick={() => {
                if (onSelectNode) onSelectNode(null);
                if (onSelectRoad) onSelectRoad(null);
                if (onSelectVehicle) onSelectVehicle(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedNode && (
            <div className="space-y-1 text-slate-300 font-mono text-[11px]">
              <div className="text-white font-sans font-bold">{selectedNode.name}</div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Type:</span>
                <span className="text-cyan-300 font-bold">{selectedNode.type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Signal:</span>
                <span className={`font-bold ${
                  selectedNode.trafficLightState === 'GREEN' ? 'text-emerald-400' :
                  selectedNode.trafficLightState === 'YELLOW' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {selectedNode.trafficLightState} {selectedNode.emergencyOverride ? '(PRIORITY OVERRIDE)' : ''}
                </span>
              </div>
            </div>
          )}

          {selectedRoad && (
            <div className="space-y-1 text-slate-300 font-mono text-[11px]">
              <div className="text-white font-sans font-bold">{selectedRoad.name}</div>
              <div>{selectedRoad.sourceNodeId} ➔ {selectedRoad.targetNodeId} ({selectedRoad.distance}m)</div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold ${selectedRoad.blocked ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedRoad.blocked ? 'BLOCKED ⛔' : selectedRoad.trafficLevel}
                </span>
              </div>
            </div>
          )}

          {selectedVehicle && (
            <div className="space-y-1 text-slate-300 font-mono text-[11px]">
              <div className="text-white font-sans font-bold">{selectedVehicle.name} ({selectedVehicle.type})</div>
              <div className="flex items-center space-x-3">
                <span>Speed: <b className="text-cyan-300">{selectedVehicle.speed} km/h</b></span>
                <span>Status: <b className="text-amber-300">{selectedVehicle.status}</b></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hover Tooltip Pill */}
      {hoveredEntity && !selectedNode && !selectedRoad && !selectedVehicle && (
        <div className="absolute top-16 left-4 z-20 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-slate-200 font-mono shadow-lg flex items-center space-x-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>
            {hoveredEntity.type === 'NODE' && `Junction: ${hoveredEntity.data.id} - ${hoveredEntity.data.name}`}
            {hoveredEntity.type === 'VEHICLE' && `Vehicle: ${hoveredEntity.data.id} - ${hoveredEntity.data.name} (${hoveredEntity.data.type})`}
            {hoveredEntity.type === 'ROAD' && `Road: ${hoveredEntity.data.id} - ${hoveredEntity.data.name}`}
          </span>
          <span className="text-cyan-400 text-[10px] uppercase font-bold">(Click to Inspect)</span>
        </div>
      )}

      {/* 3D Navigation Guide Pill */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center space-x-3 px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[11px] text-slate-200 font-mono shadow-xl">
        <span className="text-cyan-400 font-bold uppercase">3D Navigation:</span>
        <span>Left Click + Drag: Rotate</span>
        <span>•</span>
        <span>Right Click: Pan</span>
        <span>•</span>
        <span>Scroll: Zoom</span>
        <span>•</span>
        <span className="text-amber-400 font-bold">Left Click Object: Select & Inspect</span>
      </div>
    </div>
  );
}
