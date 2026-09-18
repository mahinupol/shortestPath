package com.smartcity.dto;

import java.util.List;
import java.util.Map;

public class CityDataDTO {
    private String cityName;
    private List<IntersectionDTO> intersections;
    private List<RoadDTO> roads;
    private List<VehicleDTO> vehicles;
    private List<EmergencyResponseDTO> emergencies;
    private Map<String, String> emergencyStations;
    private Map<String, String> landmarks;
    private SimulationStateDTO simulationState;

    public CityDataDTO() {
    }

    public String getCityName() {
        return cityName;
    }

    public void setCityName(String cityName) {
        this.cityName = cityName;
    }

    public List<IntersectionDTO> getIntersections() {
        return intersections;
    }

    public void setIntersections(List<IntersectionDTO> intersections) {
        this.intersections = intersections;
    }

    public List<RoadDTO> getRoads() {
        return roads;
    }

    public void setRoads(List<RoadDTO> roads) {
        this.roads = roads;
    }

    public List<VehicleDTO> getVehicles() {
        return vehicles;
    }

    public void setVehicles(List<VehicleDTO> vehicles) {
        this.vehicles = vehicles;
    }

    public List<EmergencyResponseDTO> getEmergencies() {
        return emergencies;
    }

    public void setEmergencies(List<EmergencyResponseDTO> emergencies) {
        this.emergencies = emergencies;
    }

    public Map<String, String> getEmergencyStations() {
        return emergencyStations;
    }

    public void setEmergencyStations(Map<String, String> emergencyStations) {
        this.emergencyStations = emergencyStations;
    }

    public Map<String, String> getLandmarks() {
        return landmarks;
    }

    public void setLandmarks(Map<String, String> landmarks) {
        this.landmarks = landmarks;
    }

    public SimulationStateDTO getSimulationState() {
        return simulationState;
    }

    public void setSimulationState(SimulationStateDTO simulationState) {
        this.simulationState = simulationState;
    }
}
