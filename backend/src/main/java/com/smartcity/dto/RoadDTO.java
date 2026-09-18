package com.smartcity.dto;

import com.smartcity.algorithm.GraphEdge;
import com.smartcity.model.enums.TrafficLevel;

public class RoadDTO {
    private String id;
    private String name;
    private String sourceNodeId;
    private String targetNodeId;
    private double distance;
    private double speedLimit;
    private TrafficLevel trafficLevel;
    private boolean blocked;
    private int lanes;
    private double travelTimeSeconds;
    private String color;

    public RoadDTO() {
    }

    public static RoadDTO fromDomain(GraphEdge edge) {
        if (edge == null) return null;
        RoadDTO dto = new RoadDTO();
        dto.setId(edge.getId());
        dto.setName(edge.getName());
        dto.setSourceNodeId(edge.getSourceNodeId());
        dto.setTargetNodeId(edge.getTargetNodeId());
        dto.setDistance(edge.getDistance());
        dto.setSpeedLimit(edge.getSpeedLimit());
        dto.setTrafficLevel(edge.getTrafficLevel());
        dto.setBlocked(edge.isBlocked());
        dto.setLanes(edge.getLanes());
        dto.setTravelTimeSeconds(Math.round(edge.calculateTravelTimeSeconds() * 10.0) / 10.0);
        dto.setColor(edge.isBlocked() ? "#ef4444" : edge.getTrafficLevel().getColorHex());
        return dto;
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

    public double getTravelTimeSeconds() {
        return travelTimeSeconds;
    }

    public void setTravelTimeSeconds(double travelTimeSeconds) {
        this.travelTimeSeconds = travelTimeSeconds;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
