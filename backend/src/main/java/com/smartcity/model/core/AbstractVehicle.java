package com.smartcity.model.core;

import com.smartcity.algorithm.AStarAlgorithm;
import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.GraphEdge;
import com.smartcity.algorithm.GraphNode;
import com.smartcity.algorithm.PathResult;
import com.smartcity.model.enums.VehicleType;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Abstract base class representing all vehicles in the simulation.
 * Demonstrates:
 * - Encapsulation (private fields, accessors, invariant protection)
 * - Abstraction (abstract priority, speed calculation, and traffic light preemption)
 * - Comparable interface implementation for PriorityQueue processing
 */
public abstract class AbstractVehicle implements Comparable<AbstractVehicle> {
    private String id;
    private String name;
    private VehicleType type;
    private double speed; // Current speed (km/h)
    private double baseSpeed; // Base speed limit (km/h)
    private double currentX;
    private double currentY;
    private String currentNodeId;
    private String targetNodeId;
    private String currentRoadId;
    private double roadProgress; // 0.0 (at start of road) to 1.0 (at end of road)
    private String status; // "IDLE", "EN_ROUTE", "STOPPED_LIGHT", "CONGESTED", "ARRIVED"
    private boolean active;

    // Route tracking
    private List<String> routeNodeIds = new ArrayList<>();
    private List<String> routeEdgeIds = new ArrayList<>();
    private int currentRouteIndex = 0;
    private double totalDistanceCovered = 0.0;
    private int rerouteCount = 0;

    public AbstractVehicle(String id, String name, VehicleType type, double baseSpeed,
                           double startX, double startY, String initialNodeId) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.baseSpeed = baseSpeed;
        this.speed = baseSpeed;
        this.currentX = startX;
        this.currentY = startY;
        this.currentNodeId = initialNodeId;
        this.targetNodeId = initialNodeId;
        this.currentRoadId = null;
        this.roadProgress = 0.0;
        this.status = "IDLE";
        this.active = true;
    }

    /**
     * Polymorphic priority calculation.
     * Higher priority vehicles take precedence in intersection clearance and dispatch.
     */
    public abstract int calculatePriority();

    /**
     * Polymorphic vehicle speed multiplier.
     */
    public abstract double getSpeedMultiplier();

    /**
     * Determines if vehicle can preempt traffic signals to force GREEN corridors.
     */
    public abstract boolean canPreemptTrafficLights();

    /**
     * Vehicle icon representation key for UI rendering.
     */
    public abstract String getVehicleIcon();

    /**
     * Assigns a computed A* route to this vehicle.
     */
    public void assignRoute(PathResult pathResult) {
        if (pathResult != null && pathResult.isFound() && !pathResult.getNodeIds().isEmpty()) {
            this.routeNodeIds = new ArrayList<>(pathResult.getNodeIds());
            this.routeEdgeIds = new ArrayList<>(pathResult.getEdgeIds());
            this.currentRouteIndex = 0;
            this.roadProgress = 0.0;
            this.status = "EN_ROUTE";

            if (routeNodeIds.size() > 1) {
                this.targetNodeId = routeNodeIds.get(routeNodeIds.size() - 1);
            }
            if (!routeEdgeIds.isEmpty()) {
                this.currentRoadId = routeEdgeIds.get(0);
            }
        }
    }

    /**
     * Increments vehicle progression along current road edge.
     *
     * @param deltaSeconds elapsed time step in seconds
     * @param graph        city graph for road spatial coordinates and conditions
     * @param lightBlocked whether a red light prevents entering or crossing the next intersection
     */
    public void advance(double deltaSeconds, Graph graph, boolean lightBlocked) {
        if (!active || routeNodeIds.isEmpty() || currentRouteIndex >= routeNodeIds.size() - 1) {
            if ("EN_ROUTE".equals(status)) {
                status = "ARRIVED";
            }
            return;
        }

        String fromNodeId = routeNodeIds.get(currentRouteIndex);
        String toNodeId = routeNodeIds.get(currentRouteIndex + 1);

        GraphNode fromNode = graph.getNode(fromNodeId);
        GraphNode toNode = graph.getNode(toNodeId);

        if (fromNode == null || toNode == null) {
            return;
        }

        GraphEdge currentEdge = (currentRoadId != null) ? graph.getEdge(currentRoadId) : null;

        // If road became blocked, stop and request rerouting
        if (currentEdge != null && currentEdge.isBlocked()) {
            this.status = "BLOCKED";
            return;
        }

        // Calculate dynamic travel speed factoring in vehicle type and road traffic
        double trafficMultiplier = (currentEdge != null) ? currentEdge.getTrafficLevel().getCostMultiplier() : 1.0;
        double effectiveSpeed = (baseSpeed * getSpeedMultiplier()) / trafficMultiplier;
        if (canPreemptTrafficLights()) {
            // Emergency vehicle reduces congestion slowdown
            effectiveSpeed = Math.max(effectiveSpeed, baseSpeed * 0.85);
        }
        this.speed = effectiveSpeed;

        double roadDistance = (currentEdge != null) ? currentEdge.getDistance() : fromNode.distanceTo(toNode);
        if (roadDistance <= 0.001) roadDistance = 1.0;

        // Advance progress (distance delta / total distance)
        double distanceDelta = (effectiveSpeed / 3.6) * deltaSeconds;
        double progressDelta = distanceDelta / roadDistance;

        // Check for traffic light block at end of current segment
        if (roadProgress + progressDelta >= 0.95 && lightBlocked && !canPreemptTrafficLights()) {
            this.roadProgress = 0.95;
            this.status = "STOPPED_LIGHT";
            this.speed = 0.0;
            // Update coordinates near node
            this.currentX = fromNode.getX() + (toNode.getX() - fromNode.getX()) * 0.95;
            this.currentY = fromNode.getY() + (toNode.getY() - fromNode.getY()) * 0.95;
            return;
        }

        this.status = trafficMultiplier > 2.0 ? "CONGESTED" : "EN_ROUTE";
        this.roadProgress += progressDelta;
        this.totalDistanceCovered += distanceDelta;

        if (this.roadProgress >= 1.0) {
            // Reached next node
            currentRouteIndex++;
            this.currentNodeId = toNodeId;
            this.currentX = toNode.getX();
            this.currentY = toNode.getY();
            this.roadProgress = 0.0;

            if (currentRouteIndex < routeEdgeIds.size()) {
                this.currentRoadId = routeEdgeIds.get(currentRouteIndex);
            } else {
                this.currentRoadId = null;
            }

            // Check if final destination reached
            if (currentRouteIndex >= routeNodeIds.size() - 1) {
                this.status = "ARRIVED";
                this.speed = 0.0;
                onDestinationReached();
            }
        } else {
            // Interpolate position along current road segment
            this.currentX = fromNode.getX() + (toNode.getX() - fromNode.getX()) * roadProgress;
            this.currentY = fromNode.getY() + (toNode.getY() - fromNode.getY()) * roadProgress;
        }
    }

    /**
     * Hook method triggered when vehicle reaches its destination.
     */
    protected void onDestinationReached() {
        // Concrete subclasses or engine may override
    }

    /**
     * Reroutes the vehicle from its current node/position to target destination using A*.
     */
    public boolean recalculateRoute(Graph graph, AStarAlgorithm aStar) {
        if (targetNodeId == null || currentNodeId == null || currentNodeId.equals(targetNodeId)) {
            return false;
        }
        PathResult newPath = aStar.findPath(graph, currentNodeId, targetNodeId, canPreemptTrafficLights());
        if (newPath.isFound()) {
            assignRoute(newPath);
            rerouteCount++;
            return true;
        }
        return false;
    }

    @Override
    public int compareTo(AbstractVehicle other) {
        if (other == null) return -1;
        // Primary: priority descending
        int priorityComparison = Integer.compare(other.calculatePriority(), this.calculatePriority());
        if (priorityComparison != 0) return priorityComparison;
        // Secondary: vehicle ID
        return this.id.compareTo(other.id);
    }

    // Encapsulated Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public VehicleType getType() {
        return type;
    }

    public void setType(VehicleType type) {
        this.type = type;
    }

    public double getSpeed() {
        return speed;
    }

    public void setSpeed(double speed) {
        this.speed = speed;
    }

    public double getBaseSpeed() {
        return baseSpeed;
    }

    public void setBaseSpeed(double baseSpeed) {
        this.baseSpeed = baseSpeed;
    }

    public double getCurrentX() {
        return currentX;
    }

    public void setCurrentX(double currentX) {
        this.currentX = currentX;
    }

    public double getCurrentY() {
        return currentY;
    }

    public void setCurrentY(double currentY) {
        this.currentY = currentY;
    }

    public String getCurrentNodeId() {
        return currentNodeId;
    }

    public void setCurrentNodeId(String currentNodeId) {
        this.currentNodeId = currentNodeId;
    }

    public String getTargetNodeId() {
        return targetNodeId;
    }

    public void setTargetNodeId(String targetNodeId) {
        this.targetNodeId = targetNodeId;
    }

    public String getCurrentRoadId() {
        return currentRoadId;
    }

    public void setCurrentRoadId(String currentRoadId) {
        this.currentRoadId = currentRoadId;
    }

    public double getRoadProgress() {
        return roadProgress;
    }

    public void setRoadProgress(double roadProgress) {
        this.roadProgress = roadProgress;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<String> getRouteNodeIds() {
        return routeNodeIds;
    }

    public void setRouteNodeIds(List<String> routeNodeIds) {
        this.routeNodeIds = routeNodeIds;
    }

    public List<String> getRouteEdgeIds() {
        return routeEdgeIds;
    }

    public void setRouteEdgeIds(List<String> routeEdgeIds) {
        this.routeEdgeIds = routeEdgeIds;
    }

    public int getCurrentRouteIndex() {
        return currentRouteIndex;
    }

    public void setCurrentRouteIndex(int currentRouteIndex) {
        this.currentRouteIndex = currentRouteIndex;
    }

    public double getTotalDistanceCovered() {
        return totalDistanceCovered;
    }

    public void setTotalDistanceCovered(double totalDistanceCovered) {
        this.totalDistanceCovered = totalDistanceCovered;
    }

    public int getRerouteCount() {
        return rerouteCount;
    }

    public void setRerouteCount(int rerouteCount) {
        this.rerouteCount = rerouteCount;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AbstractVehicle that = (AbstractVehicle) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
