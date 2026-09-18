package com.smartcity.simulation;

import com.smartcity.algorithm.*;
import com.smartcity.model.core.*;
import com.smartcity.model.enums.*;
import com.smartcity.patterns.factory.VehicleFactory;
import com.smartcity.patterns.observer.SimulationEventListener;
import com.smartcity.patterns.observer.TrafficObserver;
import com.smartcity.patterns.observer.TrafficSubject;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SimulationEngine manages the real-time smart city simulation loop.
 * Demonstrates:
 * - Thread-safe state transitions (Start, Pause, Resume, Reset, Speed changes)
 * - Vehicle movement updates & collision-free road interpolation
 * - Traffic light cycling with emergency green-wave preemption
 * - Dynamic route recalculation on road blockage or congestion spikes
 * - Observer pattern event dispatching
 */
@Component
public class SimulationEngine implements TrafficObserver {

    private final City city = new City("Neo Metropolis Smart City");
    private final AStarAlgorithm aStar = new AStarAlgorithm();
    private final TrafficSubject trafficSubject = new TrafficSubject();

    private boolean running = true;
    private boolean paused = false;
    private double speedMultiplier = 1.0;
    private long tickCount = 0;
    private long simulationStartTimeEpoch = Instant.now().getEpochSecond();
    private int totalReroutes = 0;

    private final List<SimulationEventListener> eventListeners = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> recentEvents = new CopyOnWriteArrayList<>();
    private final Random random = new Random();

    public SimulationEngine() {
        trafficSubject.registerObserver(this);
    }

    public City getCity() {
        return city;
    }

    public AStarAlgorithm getAStar() {
        return aStar;
    }

    public TrafficSubject getTrafficSubject() {
        return trafficSubject;
    }

    public void addEventListener(SimulationEventListener listener) {
        if (listener != null && !eventListeners.contains(listener)) {
            eventListeners.add(listener);
        }
    }

    public void logEvent(String eventType, String message, String entityId) {
        Map<String, Object> event = new HashMap<>();
        event.put("id", UUID.randomUUID().toString());
        event.put("eventType", eventType);
        event.put("message", message);
        event.put("entityId", entityId);
        event.put("timestamp", Instant.now().getEpochSecond());

        recentEvents.add(0, event);
        if (recentEvents.size() > 100) {
            recentEvents.remove(recentEvents.size() - 1);
        }

        for (SimulationEventListener listener : eventListeners) {
            listener.onSimulationEvent(eventType, message, event);
        }
    }

    public List<Map<String, Object>> getRecentEvents() {
        return Collections.unmodifiableList(recentEvents);
    }

    /**
     * Executes one discrete simulation tick.
     *
     * @param deltaSeconds elapsed real-time delta (typically 0.5s to 1.0s)
     */
    public synchronized void tick(double deltaSeconds) {
        if (!running || paused) {
            return;
        }

        double scaledDelta = deltaSeconds * speedMultiplier;
        tickCount++;

        // 1. Advance traffic signals at all intersections
        updateTrafficLights(scaledDelta);

        // 2. Preempt traffic lights for approaching emergency vehicles (Green Corridor)
        applyEmergencyGreenWave();

        // 3. Advance all vehicles along their routes
        updateVehicles(scaledDelta);

        // 4. Update and check active emergencies
        updateEmergencies(scaledDelta);

        // 5. Periodic gentle traffic fluctuations to simulate realistic urban flow
        if (tickCount % 20 == 0) {
            simulateOrganicTrafficVariation();
        }
    }

    private void updateTrafficLights(double scaledDelta) {
        for (TrafficLight light : city.getAllTrafficLights()) {
            light.tick(scaledDelta);
        }
    }

    /**
     * Emergency Green Wave: Detects active emergency vehicles heading toward an intersection
     * and forces the signal to GREEN in their approach path.
     */
    private void applyEmergencyGreenWave() {
        for (AbstractVehicle vehicle : city.getAllVehicles()) {
            if (vehicle instanceof EmergencyVehicle ev && ev.isSirenActive() && "EN_ROUTE".equals(ev.getStatus())) {
                List<String> route = ev.getRouteNodeIds();
                int idx = ev.getCurrentRouteIndex();
                if (idx < route.size() - 1) {
                    String nextIntersectionId = route.get(idx + 1);
                    TrafficLight light = city.getTrafficLight(nextIntersectionId);
                    if (light != null && !light.isEmergencyOverride()) {
                        light.preemptGreen(12.0);
                        logEvent("PRIORITY_GREEN_WAVE",
                                "Green corridor granted to " + ev.getName() + " at " + nextIntersectionId,
                                nextIntersectionId);
                    }
                }
            }
        }
    }

    private void updateVehicles(double scaledDelta) {
        Graph graph = city.getGraph();

        for (AbstractVehicle vehicle : city.getAllVehicles()) {
            if (!vehicle.isActive()) continue;

            // Check if upcoming intersection signal is RED
            boolean isLightBlocked = false;
            List<String> route = vehicle.getRouteNodeIds();
            int idx = vehicle.getCurrentRouteIndex();
            if (idx < route.size() - 1) {
                String nextNodeId = route.get(idx + 1);
                TrafficLight light = city.getTrafficLight(nextNodeId);
                if (light != null && light.getState() == TrafficLightState.RED) {
                    isLightBlocked = true;
                }
            }

            // Check if upcoming road is blocked by an accident or closure
            if (vehicle.getCurrentRoadId() != null) {
                GraphEdge currentEdge = graph.getEdge(vehicle.getCurrentRoadId());
                if (currentEdge != null && currentEdge.isBlocked()) {
                    // Trigger immediate A* route recalculation
                    boolean rerouted = vehicle.recalculateRoute(graph, aStar);
                    if (rerouted) {
                        totalReroutes++;
                        logEvent("REROUTE_SUCCESS",
                                vehicle.getName() + " recalculated route to avoid blocked road " + currentEdge.getName(),
                                vehicle.getId());
                    } else {
                        vehicle.setStatus("BLOCKED");
                        logEvent("REROUTE_FAILED",
                                vehicle.getName() + " cannot find alternate route (all paths blocked)",
                                vehicle.getId());
                    }
                    continue;
                }
            }

            // Move vehicle
            vehicle.advance(scaledDelta, graph, isLightBlocked);

            // Handle destination arrival
            if ("ARRIVED".equals(vehicle.getStatus())) {
                handleVehicleArrival(vehicle, graph);
            }
        }
    }

    private void handleVehicleArrival(AbstractVehicle vehicle, Graph graph) {
        if (vehicle instanceof EmergencyVehicle ev) {
            String emergencyId = ev.getActiveEmergencyId();
            if (emergencyId != null) {
                AbstractEmergency emergency = city.getEmergency(emergencyId);
                if (emergency != null && emergency.getStatus() != EmergencyStatus.RESOLVED) {
                    emergency.markResolved();
                    ev.setActiveEmergencyId(null);
                    ev.setStatus("IDLE");
                    logEvent("EMERGENCY_RESOLVED",
                            emergency.getTitle() + " was successfully resolved by " + ev.getName() + "!",
                            emergency.getId());
                }
            } else {
                ev.setStatus("ARRIVED");
                ev.setSpeed(0.0);
                logEvent("VEHICLE_ARRIVED",
                        ev.getName() + " reached destination " + ev.getTargetNodeId() + " successfully!",
                        ev.getId());
            }
        } else {
            vehicle.setStatus("ARRIVED");
            vehicle.setSpeed(0.0);
            logEvent("VEHICLE_ARRIVED",
                    vehicle.getName() + " reached destination " + vehicle.getTargetNodeId() + " successfully!",
                    vehicle.getId());
        }
    }

    private void updateEmergencies(double scaledDelta) {
        for (AbstractEmergency emergency : city.getAllEmergencies()) {
            if (emergency.getStatus() == EmergencyStatus.DISPATCHED || emergency.getStatus() == EmergencyStatus.EN_ROUTE) {
                AbstractVehicle v = city.getVehicle(emergency.getAssignedVehicleId());
                if (v != null && v.getSpeed() > 0) {
                    // Update remaining ETA
                    double remainingProgress = 1.0 - v.getRoadProgress();
                    double remainingEdges = Math.max(0, v.getRouteNodeIds().size() - 1 - v.getCurrentRouteIndex());
                    double approxRemainingDistance = remainingEdges * 400.0 * remainingProgress;
                    double speedMps = (v.getSpeed() / 3.6);
                    emergency.setEtaSeconds(Math.max(0, Math.round(approxRemainingDistance / (speedMps > 0 ? speedMps : 10.0))));
                }
            }
        }
    }

    /**
     * Organic traffic oscillation across non-blocked roads.
     */
    private void simulateOrganicTrafficVariation() {
        Graph graph = city.getGraph();
        for (GraphEdge edge : graph.getAllEdges()) {
            if (edge.isBlocked()) continue;
            // 8% chance to shift traffic level
            if (random.nextDouble() < 0.08) {
                TrafficLevel current = edge.getTrafficLevel();
                TrafficLevel next = switch (current) {
                    case LOW -> random.nextBoolean() ? TrafficLevel.LOW : TrafficLevel.MEDIUM;
                    case MEDIUM -> random.nextBoolean() ? TrafficLevel.LOW : TrafficLevel.HIGH;
                    case HIGH -> random.nextBoolean() ? TrafficLevel.MEDIUM : TrafficLevel.CRITICAL;
                    case CRITICAL -> TrafficLevel.HIGH;
                };
                edge.setTrafficLevel(next);
            }
        }
    }

    /**
     * Observer Pattern Implementation: Reacts to traffic level updates or road blockages.
     * Recalculates routes of any vehicles traversing the affected road.
     */
    @Override
    public void onTrafficChanged(String roadId, TrafficLevel oldLevel, TrafficLevel newLevel, boolean isBlocked) {
        if (isBlocked) {
            logEvent("ROAD_BLOCKED", "Road " + roadId + " is now BLOCKED. Triggering dynamic rerouting.", roadId);
            // Check all vehicles currently on this road or having this road in their upcoming path
            Graph graph = city.getGraph();
            for (AbstractVehicle vehicle : city.getAllVehicles()) {
                if (!vehicle.isActive()) continue;
                boolean pathContainsRoad = vehicle.getRouteEdgeIds().contains(roadId)
                        || roadId.equals(vehicle.getCurrentRoadId());
                if (pathContainsRoad) {
                    boolean rerouted = vehicle.recalculateRoute(graph, aStar);
                    if (rerouted) {
                        totalReroutes++;
                        logEvent("REROUTE_SUCCESS",
                                vehicle.getName() + " automatically rerouted around blocked road " + roadId,
                                vehicle.getId());
                    }
                }
            }
        } else if (oldLevel != newLevel) {
            logEvent("TRAFFIC_UPDATE",
                    "Traffic on road " + roadId + " updated from " + oldLevel + " to " + newLevel,
                    roadId);
        }
    }

    // Simulation Controls

    public void start() {
        this.running = true;
        this.paused = false;
        logEvent("SIM_START", "Simulation resumed / started", "SYSTEM");
    }

    public void pause() {
        this.paused = true;
        logEvent("SIM_PAUSE", "Simulation paused", "SYSTEM");
    }

    public void resume() {
        this.paused = false;
        logEvent("SIM_RESUME", "Simulation resumed", "SYSTEM");
    }

    public void reset() {
        this.running = true;
        this.paused = false;
        this.tickCount = 0;
        this.totalReroutes = 0;
        this.simulationStartTimeEpoch = Instant.now().getEpochSecond();
        // Clear all vehicles for clean state
        city.clearVehicles();
        // Unblock all roads
        Graph graph = city.getGraph();
        for (GraphEdge edge : graph.getAllEdges()) {
            edge.setBlocked(false);
            edge.setTrafficLevel(TrafficLevel.LOW);
        }
        logEvent("SIM_RESET", "Simulation reset: all vehicles cleared, city baseline state restored", "SYSTEM");
    }

    public void setSpeedMultiplier(double multiplier) {
        if (multiplier > 0) {
            this.speedMultiplier = multiplier;
            logEvent("SIM_SPEED", "Simulation speed updated to " + multiplier + "x", "SYSTEM");
        }
    }

    public boolean isRunning() {
        return running;
    }

    public boolean isPaused() {
        return paused;
    }

    public double getSpeedMultiplier() {
        return speedMultiplier;
    }

    public long getTickCount() {
        return tickCount;
    }

    public int getTotalReroutes() {
        return totalReroutes;
    }

    public String getFormattedSimTime() {
        long elapsedSeconds = (long) (tickCount * speedMultiplier);
        long hours = elapsedSeconds / 3600;
        long minutes = (elapsedSeconds % 3600) / 60;
        long seconds = elapsedSeconds % 60;
        return String.format("%02d:%02d:%02d", (hours + 8) % 24, minutes, seconds);
    }
}
