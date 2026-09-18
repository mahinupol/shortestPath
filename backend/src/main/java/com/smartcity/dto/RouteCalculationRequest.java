package com.smartcity.dto;

public class RouteCalculationRequest {
    private String sourceNodeId;
    private String targetNodeId;
    private String strategy; // "SHORTEST", "FASTEST", "EMERGENCY"
    private boolean isEmergency;

    public RouteCalculationRequest() {
    }

    public RouteCalculationRequest(String sourceNodeId, String targetNodeId, String strategy, boolean isEmergency) {
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.strategy = strategy;
        this.isEmergency = isEmergency;
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

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public boolean isEmergency() {
        return isEmergency;
    }

    public void setEmergency(boolean emergency) {
        isEmergency = emergency;
    }
}
