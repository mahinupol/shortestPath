package com.smartcity.entity;

import com.smartcity.model.enums.VehicleType;
import jakarta.persistence.*;

@Entity
@Table(name = "vehicles")
public class VehicleEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private VehicleType type;

    private double speed;
    private double currentX;
    private double currentY;
    private String currentNodeId;
    private String targetNodeId;
    private String currentRoadId;
    private String status;
    private boolean active;

    public VehicleEntity() {
    }

    public VehicleEntity(String id, String name, VehicleType type, double speed,
                         double currentX, double currentY, String currentNodeId,
                         String targetNodeId, String currentRoadId, String status, boolean active) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.speed = speed;
        this.currentX = currentX;
        this.currentY = currentY;
        this.currentNodeId = currentNodeId;
        this.targetNodeId = targetNodeId;
        this.currentRoadId = currentRoadId;
        this.status = status;
        this.active = active;
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
}
