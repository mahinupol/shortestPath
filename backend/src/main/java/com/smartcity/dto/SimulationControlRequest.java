package com.smartcity.dto;

public class SimulationControlRequest {
    private String action; // "START", "PAUSE", "RESUME", "RESET", "STEP"
    private Double speedMultiplier; // 0.5, 1.0, 2.0, 5.0, 10.0

    public SimulationControlRequest() {
    }

    public SimulationControlRequest(String action, Double speedMultiplier) {
        this.action = action;
        this.speedMultiplier = speedMultiplier;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Double getSpeedMultiplier() {
        return speedMultiplier;
    }

    public void setSpeedMultiplier(Double speedMultiplier) {
        this.speedMultiplier = speedMultiplier;
    }
}
