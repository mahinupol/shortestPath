package com.smartcity.dto;

import com.smartcity.algorithm.GraphNode;
import com.smartcity.model.core.TrafficLight;
import com.smartcity.model.enums.TrafficLightState;

public class IntersectionDTO {
    private String id;
    private String name;
    private double x;
    private double y;
    private String type;
    private String district;
    private TrafficLightState trafficLightState;
    private boolean emergencyOverride;

    public IntersectionDTO() {
    }

    public static IntersectionDTO fromDomain(GraphNode node, TrafficLight light) {
        if (node == null) return null;
        IntersectionDTO dto = new IntersectionDTO();
        dto.setId(node.getId());
        dto.setName(node.getName());
        dto.setX(node.getX());
        dto.setY(node.getY());
        dto.setType(node.getType());
        dto.setDistrict(node.getDistrict());
        if (light != null) {
            dto.setTrafficLightState(light.getState());
            dto.setEmergencyOverride(light.isEmergencyOverride());
        } else {
            dto.setTrafficLightState(TrafficLightState.GREEN);
            dto.setEmergencyOverride(false);
        }
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public TrafficLightState getTrafficLightState() {
        return trafficLightState;
    }

    public void setTrafficLightState(TrafficLightState trafficLightState) {
        this.trafficLightState = trafficLightState;
    }

    public boolean isEmergencyOverride() {
        return emergencyOverride;
    }

    public void setEmergencyOverride(boolean emergencyOverride) {
        this.emergencyOverride = emergencyOverride;
    }
}
