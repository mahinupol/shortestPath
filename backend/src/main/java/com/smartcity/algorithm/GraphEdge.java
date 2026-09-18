package com.smartcity.algorithm;

import com.smartcity.model.enums.TrafficLevel;

import java.util.Objects;

/**
 * Represents a road segment connecting two graph nodes (intersections).
 * Encapsulates length, speed limits, traffic congestion, and blocked status.
 */
public class GraphEdge {
    private String id;
    private String name;
    private String sourceNodeId;
    private String targetNodeId;
    private double distance; // meters or simulation distance units
    private double speedLimit; // km/h or units/sec
    private TrafficLevel trafficLevel;
    private boolean blocked;
    private int lanes;

    public GraphEdge() {
        this.trafficLevel = TrafficLevel.LOW;
        this.blocked = false;
        this.lanes = 2;
        this.speedLimit = 50.0;
    }

    public GraphEdge(String id, String name, String sourceNodeId, String targetNodeId,
                     double distance, double speedLimit, int lanes) {
        this.id = id;
        this.name = name;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.distance = distance;
        this.speedLimit = speedLimit > 0 ? speedLimit : 50.0;
        this.trafficLevel = TrafficLevel.LOW;
        this.blocked = false;
        this.lanes = lanes > 0 ? lanes : 2;
    }

    /**
     * Calculates estimated travel time in seconds, factoring in current traffic level.
     */
    public double calculateTravelTimeSeconds() {
        if (blocked) {
            return Double.POSITIVE_INFINITY;
        }
        double effectiveSpeed = (speedLimit / 3.6) / trafficLevel.getCostMultiplier();
        if (effectiveSpeed <= 0.1) effectiveSpeed = 0.1;
        return distance / effectiveSpeed;
    }

    /**
     * Calculates the routing cost considering distance, traffic congestion, and emergency priority.
     *
     * @param isEmergency whether the querying vehicle is an emergency vehicle
     * @return routing cost weight (higher = less desirable)
     */
    public double calculateCost(boolean isEmergency) {
        if (blocked) {
            return Double.POSITIVE_INFINITY;
        }

        // Base cost is physical distance
        double multiplier = trafficLevel.getCostMultiplier();

        // Emergency vehicles with priority sirens reduce traffic penalties by 50%
        // but still prefer clearer roads when alternative paths exist
        if (isEmergency) {
            multiplier = 1.0 + (multiplier - 1.0) * 0.4;
        }

        return distance * multiplier;
    }

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

    public String getSourceNodeId() {
        return sourceNodeId;
    }

    public void setSourceNodeId(String sourceNodeId) {
        this.sourceNodeId = sourceNodeId;
    }

    public String getTargetNodeId() {
        return targetNodeId;
    }

    public void setTargetNodeId(String targetNodeId) {
        this.targetNodeId = targetNodeId;
    }

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }

    public double getSpeedLimit() {
        return speedLimit;
    }

    public void setSpeedLimit(double speedLimit) {
        this.speedLimit = speedLimit;
    }

    public TrafficLevel getTrafficLevel() {
        return trafficLevel;
    }

    public void setTrafficLevel(TrafficLevel trafficLevel) {
        this.trafficLevel = trafficLevel;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }

    public int getLanes() {
        return lanes;
    }

    public void setLanes(int lanes) {
        this.lanes = lanes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GraphEdge graphEdge = (GraphEdge) o;
        return Objects.equals(id, graphEdge.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "GraphEdge{" +
                "id='" + id + '\'' +
                ", " + sourceNodeId + "->" + targetNodeId +
                ", dist=" + distance +
                ", traffic=" + trafficLevel +
                ", blocked=" + blocked +
                '}';
    }
}
