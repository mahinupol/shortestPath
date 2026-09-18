package com.smartcity.service;

import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.GraphEdge;
import com.smartcity.algorithm.GraphNode;
import com.smartcity.dto.*;
import com.smartcity.model.core.AbstractEmergency;
import com.smartcity.model.core.AbstractVehicle;
import com.smartcity.model.core.City;
import com.smartcity.model.core.TrafficLight;
import com.smartcity.simulation.SimulationEngine;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CityService {

    private final SimulationEngine simulationEngine;

    public CityService(SimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
    }

    public CityDataDTO getCityData() {
        City city = simulationEngine.getCity();
        Graph graph = city.getGraph();

        CityDataDTO cityData = new CityDataDTO();
        cityData.setCityName(city.getCityName());
        cityData.setEmergencyStations(city.getEmergencyStations());
        cityData.setLandmarks(city.getLandmarks());

        // Intersections & Traffic Lights
        List<IntersectionDTO> intersectionDTOs = new ArrayList<>();
        for (GraphNode node : graph.getAllNodes()) {
            TrafficLight light = city.getTrafficLight(node.getId());
            intersectionDTOs.add(IntersectionDTO.fromDomain(node, light));
        }
        cityData.setIntersections(intersectionDTOs);

        // Roads
        List<RoadDTO> roadDTOs = new ArrayList<>();
        for (GraphEdge edge : graph.getAllEdges()) {
            roadDTOs.add(RoadDTO.fromDomain(edge));
        }
        cityData.setRoads(roadDTOs);

        // Vehicles
        List<VehicleDTO> vehicleDTOs = new ArrayList<>();
        for (AbstractVehicle vehicle : city.getAllVehicles()) {
            vehicleDTOs.add(VehicleDTO.fromDomain(vehicle));
        }
        cityData.setVehicles(vehicleDTOs);

        // Emergencies
        List<EmergencyResponseDTO> emergencyDTOs = new ArrayList<>();
        for (AbstractEmergency emergency : city.getAllEmergencies()) {
            emergencyDTOs.add(EmergencyResponseDTO.fromDomain(emergency));
        }
        cityData.setEmergencies(emergencyDTOs);

        // Simulation State
        SimulationStateDTO stateDTO = new SimulationStateDTO();
        stateDTO.setRunning(simulationEngine.isRunning());
        stateDTO.setPaused(simulationEngine.isPaused());
        stateDTO.setSpeedMultiplier(simulationEngine.getSpeedMultiplier());
        stateDTO.setTickCount(simulationEngine.getTickCount());
        stateDTO.setFormattedSimTime(simulationEngine.getFormattedSimTime());
        stateDTO.setTotalVehicles(city.getAllVehicles().size());

        int activeCount = 0;
        int emergencyCount = 0;
        double speedSum = 0;
        for (AbstractVehicle v : city.getAllVehicles()) {
            if (v.isActive()) activeCount++;
            if (v.getType().isEmergency()) emergencyCount++;
            speedSum += v.getSpeed();
        }
        stateDTO.setActiveVehicles(activeCount);
        stateDTO.setEmergencyVehicles(emergencyCount);
        stateDTO.setAverageSpeed(activeCount > 0 ? Math.round((speedSum / activeCount) * 10.0) / 10.0 : 0.0);

        int activeEmergencies = 0;
        for (AbstractEmergency e : city.getAllEmergencies()) {
            if (e.getStatus() != com.smartcity.model.enums.EmergencyStatus.RESOLVED) {
                activeEmergencies++;
            }
        }
        stateDTO.setActiveEmergencies(activeEmergencies);

        int blockedRoads = 0;
        for (GraphEdge e : graph.getAllEdges()) {
            if (e.isBlocked()) blockedRoads++;
        }
        stateDTO.setBlockedRoadsCount(blockedRoads);
        stateDTO.setTotalReroutes(simulationEngine.getTotalReroutes());

        cityData.setSimulationState(stateDTO);
        return cityData;
    }
}
