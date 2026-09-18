package com.smartcity.service;

import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.GraphEdge;
import com.smartcity.dto.AnalyticsDTO;
import com.smartcity.dto.EmergencyResponseDTO;
import com.smartcity.model.core.AbstractEmergency;
import com.smartcity.model.core.AbstractVehicle;
import com.smartcity.model.core.City;
import com.smartcity.model.enums.EmergencyStatus;
import com.smartcity.model.enums.TrafficLevel;
import com.smartcity.model.enums.VehicleType;
import com.smartcity.simulation.SimulationEngine;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AnalyticsService {

    private final SimulationEngine simulationEngine;

    public AnalyticsService(SimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
    }

    public AnalyticsDTO getAnalytics() {
        City city = simulationEngine.getCity();
        Graph graph = city.getGraph();

        AnalyticsDTO dto = new AnalyticsDTO();
        dto.setTotalVehicles(city.getAllVehicles().size());

        int activeVehicles = 0;
        int emergencyVehicles = 0;
        double speedSum = 0;
        Map<String, Integer> typeDist = new HashMap<>();
        for (VehicleType vt : VehicleType.values()) {
            typeDist.put(vt.name(), 0);
        }

        for (AbstractVehicle v : city.getAllVehicles()) {
            if (v.isActive()) activeVehicles++;
            if (v.getType().isEmergency()) emergencyVehicles++;
            speedSum += v.getSpeed();
            typeDist.put(v.getType().name(), typeDist.getOrDefault(v.getType().name(), 0) + 1);
        }

        dto.setActiveVehicles(activeVehicles);
        dto.setEmergencyVehicles(emergencyVehicles);
        dto.setAverageSpeedKmh(activeVehicles > 0 ? Math.round((speedSum / activeVehicles) * 10.0) / 10.0 : 0.0);
        dto.setVehicleTypeDistribution(typeDist);

        // Emergencies
        int activeEmergencies = 0;
        int resolvedEmergencies = 0;
        double totalResponseDuration = 0;
        List<EmergencyResponseDTO> emergencyRecords = new ArrayList<>();

        for (AbstractEmergency e : city.getAllEmergencies()) {
            if (e.getStatus() == EmergencyStatus.RESOLVED) {
                resolvedEmergencies++;
                totalResponseDuration += e.getResponseDurationSeconds();
            } else {
                activeEmergencies++;
            }
            emergencyRecords.add(EmergencyResponseDTO.fromDomain(e));
        }

        dto.setActiveEmergencies(activeEmergencies);
        dto.setResolvedEmergencies(resolvedEmergencies);
        dto.setAverageResponseTimeSeconds(resolvedEmergencies > 0 ? Math.round((totalResponseDuration / resolvedEmergencies) * 10.0) / 10.0 : 45.0);
        dto.setEmergencyRecords(emergencyRecords);

        // Traffic Breakdown
        Map<String, Integer> trafficDist = new HashMap<>();
        for (TrafficLevel tl : TrafficLevel.values()) {
            trafficDist.put(tl.name(), 0);
        }
        int blockedCount = 0;

        for (GraphEdge edge : graph.getAllEdges()) {
            if (edge.isBlocked()) {
                blockedCount++;
            } else {
                trafficDist.put(edge.getTrafficLevel().name(), trafficDist.getOrDefault(edge.getTrafficLevel().name(), 0) + 1);
            }
        }

        dto.setTrafficDistribution(trafficDist);
        dto.setBlockedRoadsCount(blockedCount);
        dto.setTotalReroutesTriggered(simulationEngine.getTotalReroutes());
        dto.setRecentEvents(simulationEngine.getRecentEvents());

        return dto;
    }
}
