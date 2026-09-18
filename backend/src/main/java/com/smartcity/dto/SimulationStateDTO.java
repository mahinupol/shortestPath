package com.smartcity.dto;

public class SimulationStateDTO {
    private boolean running;
    private boolean paused;
    private double speedMultiplier;
    private long tickCount;
    private String formattedSimTime;
    private int totalVehicles;
    private int activeVehicles;
    private int emergencyVehicles;
    private int activeEmergencies;
    private int blockedRoadsCount;
    private double averageSpeed;
    private String averageTrafficLevel;
    private int totalReroutes;

    public SimulationStateDTO() {
    }

    public boolean isRunning() {
        return running;
    }

    public void setRunning(boolean running) {
        this.running = running;
    }

    public boolean isPaused() {
        return paused;
    }

    public void setPaused(boolean paused) {
        this.paused = paused;
    }

    public double getSpeedMultiplier() {
        return speedMultiplier;
    }

    public void setSpeedMultiplier(double speedMultiplier) {
        this.speedMultiplier = speedMultiplier;
    }

    public long getTickCount() {
        return tickCount;
    }

    public void setTickCount(long tickCount) {
        this.tickCount = tickCount;
    }

    public String getFormattedSimTime() {
        return formattedSimTime;
    }

    public void setFormattedSimTime(String formattedSimTime) {
        this.formattedSimTime = formattedSimTime;
    }

    public int getTotalVehicles() {
        return totalVehicles;
    }

    public void setTotalVehicles(int totalVehicles) {
        this.totalVehicles = totalVehicles;
    }

    public int getActiveVehicles() {
        return activeVehicles;
    }

    public void setActiveVehicles(int activeVehicles) {
        this.activeVehicles = activeVehicles;
    }

    public int getEmergencyVehicles() {
        return emergencyVehicles;
    }

    public void setEmergencyVehicles(int emergencyVehicles) {
        this.emergencyVehicles = emergencyVehicles;
    }

    public int getActiveEmergencies() {
        return activeEmergencies;
    }

    public void setActiveEmergencies(int activeEmergencies) {
        this.activeEmergencies = activeEmergencies;
    }

    public int getBlockedRoadsCount() {
        return blockedRoadsCount;
    }

    public void setBlockedRoadsCount(int blockedRoadsCount) {
        this.blockedRoadsCount = blockedRoadsCount;
    }

    public double getAverageSpeed() {
        return averageSpeed;
    }

    public void setAverageSpeed(double averageSpeed) {
        this.averageSpeed = averageSpeed;
    }

    public String getAverageTrafficLevel() {
        return averageTrafficLevel;
    }

    public void setAverageTrafficLevel(String averageTrafficLevel) {
        this.averageTrafficLevel = averageTrafficLevel;
    }

    public int getTotalReroutes() {
        return totalReroutes;
    }

    public void setTotalReroutes(int totalReroutes) {
        this.totalReroutes = totalReroutes;
    }
}
