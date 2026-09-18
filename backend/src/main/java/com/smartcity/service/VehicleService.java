package com.smartcity.service;

import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.GraphNode;
import com.smartcity.algorithm.PathResult;
import com.smartcity.dto.RouteCalculationRequest;
import com.smartcity.dto.VehicleDTO;
import com.smartcity.dto.VehicleDeployResponseDTO;
import com.smartcity.exception.VehicleNotFoundException;
import com.smartcity.model.core.AbstractVehicle;
import com.smartcity.model.core.City;
import com.smartcity.model.enums.VehicleType;
import com.smartcity.patterns.factory.VehicleFactory;
import com.smartcity.simulation.SimulationEngine;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class VehicleService {

    private final SimulationEngine simulationEngine;
    private final RouteService routeService;

    public VehicleService(SimulationEngine simulationEngine, RouteService routeService) {
        this.simulationEngine = simulationEngine;
        this.routeService = routeService;
    }

    public List<VehicleDTO> getAllVehicles() {
        City city = simulationEngine.getCity();
        List<VehicleDTO> dtos = new ArrayList<>();
        for (AbstractVehicle vehicle : city.getAllVehicles()) {
            dtos.add(VehicleDTO.fromDomain(vehicle));
        }
        return dtos;
    }

    public VehicleDTO getVehicleById(String vehicleId) {
        City city = simulationEngine.getCity();
        AbstractVehicle vehicle = city.getVehicle(vehicleId);
        if (vehicle == null) {
            throw new VehicleNotFoundException(vehicleId);
        }
        return VehicleDTO.fromDomain(vehicle);
    }

    public VehicleDTO updateVehicleSpeed(String vehicleId, double newSpeed) {
        City city = simulationEngine.getCity();
        AbstractVehicle vehicle = city.getVehicle(vehicleId);
        if (vehicle == null) {
            throw new VehicleNotFoundException(vehicleId);
        }
        if (newSpeed > 0) {
            vehicle.setBaseSpeed(newSpeed);
            vehicle.setSpeed(newSpeed);
            simulationEngine.logEvent("VEHICLE_SPEED_CHANGED", vehicle.getName() + " speed updated to " + newSpeed + " km/h", vehicleId);
        }
        return VehicleDTO.fromDomain(vehicle);
    }

    public void clearAllVehicles() {
        City city = simulationEngine.getCity();
        city.clearVehicles();
        simulationEngine.logEvent("VEHICLES_CLEARED", "All vehicles cleared from the city map.", "SYSTEM");
    }

    public VehicleDeployResponseDTO deployVehicle(VehicleType type, String startNodeId, String targetNodeId, String algorithm) {
        return deployVehicle(type, startNodeId, targetNodeId, algorithm, null);
    }

    public VehicleDeployResponseDTO deployVehicle(VehicleType type, String startNodeId, String targetNodeId, String algorithm, Double customSpeed) {
        City city = simulationEngine.getCity();
        Graph graph = city.getGraph();
        GraphNode startNode = graph.getNode(startNodeId);

        if (startNode == null) {
            throw new IllegalArgumentException("Start intersection '" + startNodeId + "' does not exist.");
        }

        GraphNode targetNode = graph.getNode(targetNodeId);
        if (targetNode == null) {
            throw new IllegalArgumentException("Target intersection '" + targetNodeId + "' does not exist.");
        }

        VehicleType vType = (type != null) ? type : VehicleType.CAR;
        String id = vType.name().substring(0, Math.min(3, vType.name().length())) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String name = vType.getDisplayName() + " " + id;
        double defaultSpeed = vType.isEmergency() ? 65.0 : 50.0;
        double speed = (customSpeed != null && customSpeed > 0) ? customSpeed : defaultSpeed;

        AbstractVehicle vehicle = VehicleFactory.createVehicle(
                vType, id, name, speed, startNode.getX(), startNode.getY(), startNodeId, targetNodeId
        );

        // Compute route using chosen algorithm strategy
        String stratKey = (algorithm != null && !algorithm.trim().isEmpty()) ? algorithm.toUpperCase() : "FASTEST";
        RouteCalculationRequest routeReq = new RouteCalculationRequest(startNodeId, targetNodeId, stratKey, vType.isEmergency());
        PathResult path = routeService.calculateRoute(routeReq);

        if (path.isFound()) {
            vehicle.assignRoute(path);
        }

        city.addVehicle(vehicle);
        simulationEngine.logEvent("VEHICLE_DISPATCHED",
                "Dispatched " + name + " from " + startNodeId + " to " + targetNodeId + " via " + path.getStrategy(),
                id);

        return new VehicleDeployResponseDTO(VehicleDTO.fromDomain(vehicle), path);
    }

    public VehicleDTO spawnVehicle(VehicleType type, String startNodeId, String targetNodeId) {
        VehicleDeployResponseDTO deployed = deployVehicle(type, startNodeId, targetNodeId, "FASTEST");
        return deployed.getVehicle();
    }
}
