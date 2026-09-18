package com.smartcity.entity;

import com.smartcity.model.enums.TrafficLevel;
import jakarta.persistence.*;

@Entity
@Table(name = "roads")
public class RoadEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String sourceNodeId;

    @Column(nullable = false)
    private String targetNodeId;

    private double distance;
    private double speedLimit;

    @Enumerated(EnumType.STRING)
    private TrafficLevel trafficLevel;

    private boolean blocked;
    private int lanes;

    public RoadEntity() {
    }

    public RoadEntity(String id, String name, String sourceNodeId, String targetNodeId,
                      double distance, double speedLimit, TrafficLevel trafficLevel,
                      boolean blocked, int lanes) {
        this.id = id;
        this.name = name;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.distance = distance;
        this.speedLimit = speedLimit;
        this.trafficLevel = trafficLevel;
        this.blocked = blocked;
        this.lanes = lanes;
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
}
