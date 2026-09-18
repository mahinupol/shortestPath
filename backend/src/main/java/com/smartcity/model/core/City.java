package com.smartcity.model.core;

import com.smartcity.algorithm.Graph;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * City aggregate class demonstrating Composition in AOOP.
 * Encapsulates the graph road network, vehicles, traffic lights, emergencies, and stations.
 */
public class City {
    private String cityName;
    private final Graph graph = new Graph();
    private final Map<String, AbstractVehicle> vehicles = new ConcurrentHashMap<>();
    private final Map<String, TrafficLight> trafficLights = new ConcurrentHashMap<>();
    private final Map<String, AbstractEmergency> emergencies = new ConcurrentHashMap<>();
    private final Map<String, String> emergencyStations = new ConcurrentHashMap<>(); // StationId -> NodeId
    private final Map<String, String> landmarks = new ConcurrentHashMap<>(); // NodeId -> Landmark Description

    public City(String cityName) {
        this.cityName = cityName;
    }

    public void addVehicle(AbstractVehicle vehicle) {
        if (vehicle != null && vehicle.getId() != null) {
            vehicles.put(vehicle.getId(), vehicle);
        }
    }

    public AbstractVehicle getVehicle(String vehicleId) {
        return vehicles.get(vehicleId);
    }

    public Collection<AbstractVehicle> getAllVehicles() {
        return Collections.unmodifiableCollection(vehicles.values());
    }

    public void removeVehicle(String vehicleId) {
        vehicles.remove(vehicleId);
    }

    public void clearVehicles() {
        vehicles.clear();
    }

    public void addTrafficLight(TrafficLight light) {
        if (light != null && light.getIntersectionId() != null) {
            trafficLights.put(light.getIntersectionId(), light);
        }
    }

    public TrafficLight getTrafficLight(String intersectionId) {
        return trafficLights.get(intersectionId);
    }

    public Collection<TrafficLight> getAllTrafficLights() {
        return Collections.unmodifiableCollection(trafficLights.values());
    }

    public void addEmergency(AbstractEmergency emergency) {
        if (emergency != null && emergency.getId() != null) {
            emergencies.put(emergency.getId(), emergency);
        }
    }

    public AbstractEmergency getEmergency(String emergencyId) {
        return emergencies.get(emergencyId);
    }

    public Collection<AbstractEmergency> getAllEmergencies() {
        return Collections.unmodifiableCollection(emergencies.values());
    }

    public void registerEmergencyStation(String stationName, String nodeId) {
        emergencyStations.put(stationName, nodeId);
    }

    public Map<String, String> getEmergencyStations() {
        return Collections.unmodifiableMap(emergencyStations);
    }

    public void registerLandmark(String nodeId, String description) {
        landmarks.put(nodeId, description);
    }

    public Map<String, String> getLandmarks() {
        return Collections.unmodifiableMap(landmarks);
    }

    public Graph getGraph() {
        return graph;
    }

    public String getCityName() {
        return cityName;
    }

    public void setCityName(String cityName) {
        this.cityName = cityName;
    }
}
