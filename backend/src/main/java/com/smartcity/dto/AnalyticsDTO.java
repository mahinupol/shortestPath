package com.smartcity.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsDTO {
    private int totalVehicles;
    private int activeVehicles;
    private int emergencyVehicles;
    private int activeEmergencies;
    private int resolvedEmergencies;
    private double averageResponseTimeSeconds;
    private double averageSpeedKmh;
    private int blockedRoadsCount;
    private int totalReroutesTriggered;

    // Categorical breakdown
    private Map<String, Integer> trafficDistribution; // LOW, MEDIUM, HIGH, CRITICAL counts
    private Map<String, Integer> vehicleTypeDistribution;
    private List<Map<String, Object>> recentEvents;
    private List<EmergencyResponseDTO> emergencyRecords;

    public AnalyticsDTO() {
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

    public int getResolvedEmergencies() {
        return resolvedEmergencies;
    }

    public void setResolvedEmergencies(int resolvedEmergencies) {
        this.resolvedEmergencies = resolvedEmergencies;
    }

    public double getAverageResponseTimeSeconds() {
        return averageResponseTimeSeconds;
    }

    public void setAverageResponseTimeSeconds(double averageResponseTimeSeconds) {
        this.averageResponseTimeSeconds = averageResponseTimeSeconds;
    }

    public double getAverageSpeedKmh() {
        return averageSpeedKmh;
    }

    public void setAverageSpeedKmh(double averageSpeedKmh) {
        this.averageSpeedKmh = averageSpeedKmh;
    }

    public int getBlockedRoadsCount() {
        return blockedRoadsCount;
    }

    public void setBlockedRoadsCount(int blockedRoadsCount) {
        this.blockedRoadsCount = blockedRoadsCount;
    }

    public int getTotalReroutesTriggered() {
        return totalReroutesTriggered;
    }

    public void setTotalReroutesTriggered(int totalReroutesTriggered) {
        this.totalReroutesTriggered = totalReroutesTriggered;
    }

    public Map<String, Integer> getTrafficDistribution() {
        return trafficDistribution;
    }

    public void setTrafficDistribution(Map<String, Integer> trafficDistribution) {
        this.trafficDistribution = trafficDistribution;
    }

    public Map<String, Integer> getVehicleTypeDistribution() {
        return vehicleTypeDistribution;
    }

    public void setVehicleTypeDistribution(Map<String, Integer> vehicleTypeDistribution) {
        this.vehicleTypeDistribution = vehicleTypeDistribution;
    }

    public List<Map<String, Object>> getRecentEvents() {
        return recentEvents;
    }

    public void setRecentEvents(List<Map<String, Object>> recentEvents) {
        this.recentEvents = recentEvents;
    }

    public List<EmergencyResponseDTO> getEmergencyRecords() {
        return emergencyRecords;
    }

    public void setEmergencyRecords(List<EmergencyResponseDTO> emergencyRecords) {
        this.emergencyRecords = emergencyRecords;
    }
}
