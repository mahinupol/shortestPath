package com.smartcity.service;

import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.GraphNode;
import com.smartcity.algorithm.PathResult;
import com.smartcity.dto.CreateEmergencyRequest;
import com.smartcity.dto.EmergencyResponseDTO;
import com.smartcity.exception.EmergencyNotFoundException;
import com.smartcity.exception.InvalidRouteException;
import com.smartcity.model.core.AbstractEmergency;
import com.smartcity.model.core.AbstractVehicle;
import com.smartcity.model.core.City;
import com.smartcity.model.core.EmergencyVehicle;
import com.smartcity.model.enums.EmergencyStatus;
import com.smartcity.model.enums.EmergencyType;
import com.smartcity.model.enums.VehicleType;
import com.smartcity.patterns.factory.EmergencyFactory;
import com.smartcity.patterns.factory.VehicleFactory;
import com.smartcity.patterns.strategy.EmergencyPriorityRouteStrategy;
import com.smartcity.simulation.SimulationEngine;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class EmergencyService {

    private final SimulationEngine simulationEngine;
    private final EmergencyPriorityRouteStrategy emergencyStrategy = new EmergencyPriorityRouteStrategy();

    public EmergencyService(SimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
    }

    public List<EmergencyResponseDTO> getAllEmergencies() {
        City city = simulationEngine.getCity();
        List<EmergencyResponseDTO> dtos = new ArrayList<>();
        for (AbstractEmergency e : city.getAllEmergencies()) {
            dtos.add(EmergencyResponseDTO.fromDomain(e));
        }
        return dtos;
    }

    public EmergencyResponseDTO getEmergencyById(String id) {
        City city = simulationEngine.getCity();
        AbstractEmergency emergency = city.getEmergency(id);
        if (emergency == null) {
            throw new EmergencyNotFoundException(id);
        }
        return EmergencyResponseDTO.fromDomain(emergency);
    }

    /**
     * Dispatches an emergency response unit:
     * 1. Validates destination
     * 2. Finds closest dispatch depot matching the emergency type (Hospital, Fire Station, Police Station)
     * 3. Selects or spawns the emergency vehicle
     * 4. Calculates priority A* route
     * 5. Activates sirens, green corridor preemption, and tracks ETA
     */
    public EmergencyResponseDTO dispatchEmergency(CreateEmergencyRequest request) {
        if (request == null || request.getTargetNodeId() == null) {
            throw new IllegalArgumentException("Target incident location must be specified.");
        }

        City city = simulationEngine.getCity();
        Graph graph = city.getGraph();

        GraphNode targetNode = graph.getNode(request.getTargetNodeId());
        if (targetNode == null) {
            throw new IllegalArgumentException("Target intersection '" + request.getTargetNodeId() + "' does not exist.");
        }

        EmergencyType type = request.getType() != null ? request.getType() : EmergencyType.MEDICAL;
        VehicleType requiredVehicleType = type.getRequiredVehicleType();

        // 1. Determine origin dispatch depot
        String sourceNodeId = request.getSourceNodeId();
        if (sourceNodeId == null || sourceNodeId.isBlank()) {
            sourceNodeId = findClosestStationNode(graph, type, targetNode);
        }

        GraphNode sourceNode = graph.getNode(sourceNodeId);
        if (sourceNode == null) {
            throw new IllegalArgumentException("Dispatch origin node '" + sourceNodeId + "' does not exist.");
        }

        // 2. Find available or spawn emergency vehicle
        EmergencyVehicle assignedVehicle = findAvailableEmergencyVehicle(city, requiredVehicleType, sourceNodeId);
        if (assignedVehicle == null) {
            // Spawn dedicated first responder at the depot
            String vId = requiredVehicleType.name().substring(0, 3) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            String vName = requiredVehicleType.getDisplayName() + " " + vId;
            AbstractVehicle newV = VehicleFactory.createVehicle(
                    requiredVehicleType, vId, vName, 65.0,
                    sourceNode.getX(), sourceNode.getY(), sourceNodeId, sourceNodeId
            );
            city.addVehicle(newV);
            assignedVehicle = (EmergencyVehicle) newV;
        }

        // 3. Compute A* Emergency Priority Route
        PathResult path = emergencyStrategy.calculateRoute(graph, assignedVehicle.getCurrentNodeId(), targetNode.getId());
        if (!path.isFound()) {
            throw new InvalidRouteException("No clear emergency route found from " + assignedVehicle.getCurrentNodeId()
                    + " to " + targetNode.getId() + " (all connecting roads are blocked).");
        }

        // 4. Create Polymorphic Emergency Object via EmergencyFactory
        String emergencyId = "EM-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String title = request.getTitle() != null && !request.getTitle().isBlank()
                ? request.getTitle()
                : type.getDescription() + " at " + targetNode.getName();
        String description = request.getDescription() != null
                ? request.getDescription()
                : "Priority dispatch initiated for " + targetNode.getName();

        AbstractEmergency emergency = EmergencyFactory.createEmergency(
                type, emergencyId, title, description, assignedVehicle.getCurrentNodeId(), targetNode.getId()
        );

        emergency.setAssignedVehicleId(assignedVehicle.getId());
        emergency.setStatus(EmergencyStatus.DISPATCHED);
        emergency.setRouteDistance(path.getTotalDistance());
        emergency.setEtaSeconds(path.getEstimatedTravelTime());

        // 5. Assign Route & Activate Vehicle
        assignedVehicle.setActiveEmergencyId(emergencyId);
        assignedVehicle.setSirenActive(true);
        assignedVehicle.assignRoute(path);

        city.addEmergency(emergency);

        simulationEngine.logEvent("EMERGENCY_DISPATCHED",
                "PRIORITY DISPATCH: " + assignedVehicle.getName() + " en route to " + targetNode.getName()
                        + " (ETA: " + Math.round(path.getEstimatedTravelTime()) + "s, Distance: " + path.getTotalDistance() + "m)",
                emergencyId);

        return EmergencyResponseDTO.fromDomain(emergency);
    }

    public EmergencyResponseDTO resolveEmergency(String emergencyId) {
        City city = simulationEngine.getCity();
        AbstractEmergency emergency = city.getEmergency(emergencyId);
        if (emergency == null) {
            throw new EmergencyNotFoundException(emergencyId);
        }

        emergency.markResolved();
        if (emergency.getAssignedVehicleId() != null) {
            AbstractVehicle v = city.getVehicle(emergency.getAssignedVehicleId());
            if (v instanceof EmergencyVehicle ev) {
                ev.setActiveEmergencyId(null);
                ev.setSirenActive(false);
                ev.setStatus("IDLE");
            }
        }

        simulationEngine.logEvent("EMERGENCY_MANUAL_RESOLVED",
                "Emergency " + emergency.getTitle() + " was manually resolved by operator.",
                emergencyId);

        return EmergencyResponseDTO.fromDomain(emergency);
    }

    private String findClosestStationNode(Graph graph, EmergencyType type, GraphNode targetNode) {
        String targetType = switch (type) {
            case MEDICAL -> "HOSPITAL";
            case FIRE -> "FIRE_STATION";
            case POLICE -> "POLICE_STATION";
        };

        GraphNode closestNode = null;
        double minDistance = Double.MAX_VALUE;

        for (GraphNode node : graph.getAllNodes()) {
            if (targetType.equalsIgnoreCase(node.getType())) {
                double dist = node.distanceTo(targetNode);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestNode = node;
                }
            }
        }

        return (closestNode != null) ? closestNode.getId() : "N13";
    }

    private EmergencyVehicle findAvailableEmergencyVehicle(City city, VehicleType type, String sourceNodeId) {
        for (AbstractVehicle v : city.getAllVehicles()) {
            if (v.getType() == type && v instanceof EmergencyVehicle ev) {
                if ("IDLE".equals(ev.getStatus()) || ev.getActiveEmergencyId() == null) {
                    return ev;
                }
            }
        }
        return null;
    }
}
