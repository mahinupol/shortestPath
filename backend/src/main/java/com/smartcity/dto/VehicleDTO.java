package com.smartcity.dto;

import com.smartcity.model.core.AbstractVehicle;
import com.smartcity.model.enums.VehicleType;

import java.util.List;

public class VehicleDTO {
    private String id;
    private String name;
    private VehicleType type;
    private double speed;
    private double baseSpeed;
    private double x;
    private double y;
    private String currentNodeId;
    private String targetNodeId;
    private String currentRoadId;
    private double roadProgress;
    private String status;
    private boolean active;
    private List<String> routeNodeIds;
    private int priority;
    private String icon;
    private int rerouteCount;

    public VehicleDTO() {
    }

    public static VehicleDTO fromDomain(AbstractVehicle v) {
        if (v == null) return null;
        VehicleDTO dto = new VehicleDTO();
        dto.setId(v.getId());
        dto.setName(v.getName());
        dto.setType(v.getType());
        dto.setSpeed(Math.round(v.getSpeed() * 10.0) / 10.0);
        dto.setBaseSpeed(v.getBaseSpeed());
        dto.setX(Math.round(v.getCurrentX() * 100.0) / 100.0);
        dto.setY(Math.round(v.getCurrentY() * 100.0) / 100.0);
        dto.setCurrentNodeId(v.getCurrentNodeId());
        dto.setTargetNodeId(v.getTargetNodeId());
        dto.setCurrentRoadId(v.getCurrentRoadId());
        dto.setRoadProgress(Math.round(v.getRoadProgress() * 1000.0) / 1000.0);
        dto.setStatus(v.getStatus());
        dto.setActive(v.isActive());
        dto.setRouteNodeIds(v.getRouteNodeIds());
        dto.setPriority(v.calculatePriority());
        dto.setIcon(v.getVehicleIcon());
        dto.setRerouteCount(v.getRerouteCount());
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

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
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

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public int getRerouteCount() {
        return rerouteCount;
    }

    public void setRerouteCount(int rerouteCount) {
        this.rerouteCount = rerouteCount;
    }
}
