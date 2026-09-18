package com.smartcity.util;

import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.GraphNode;
import com.smartcity.algorithm.PathResult;
import com.smartcity.entity.IntersectionEntity;
import com.smartcity.entity.RoadEntity;
import com.smartcity.entity.VehicleEntity;
import com.smartcity.model.core.AbstractVehicle;
import com.smartcity.model.core.City;
import com.smartcity.model.core.TrafficLight;
import com.smartcity.model.enums.TrafficLevel;
import com.smartcity.model.enums.TrafficLightState;
import com.smartcity.model.enums.VehicleType;
import com.smartcity.patterns.factory.VehicleFactory;
import com.smartcity.repository.IntersectionRepository;
import com.smartcity.repository.RoadRepository;
import com.smartcity.repository.VehicleRepository;
import com.smartcity.simulation.SimulationEngine;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Bootstraps the Smart City with realistic seed data:
 * - 25 Intersections (5x5 grid with diagonal avenues)
 * - 48 Two-Way Road segments with speed limits & traffic levels
 * - 3 Hospitals, 2 Fire Stations, 2 Police Stations
 * - Key Landmarks (City Mall, Tech Park, Financial Center, etc.)
 * - 30+ initial vehicles roaming along computed A* paths
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final SimulationEngine simulationEngine;
    private final IntersectionRepository intersectionRepository;
    private final RoadRepository roadRepository;
    private final VehicleRepository vehicleRepository;

    public DataInitializer(SimulationEngine simulationEngine,
                           IntersectionRepository intersectionRepository,
                           RoadRepository roadRepository,
                           VehicleRepository vehicleRepository) {
        this.simulationEngine = simulationEngine;
        this.intersectionRepository = intersectionRepository;
        this.roadRepository = roadRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    public void run(String... args) {
        initCityNetwork();
    }

    public void initCityNetwork() {
        City city = simulationEngine.getCity();
        Graph graph = city.getGraph();
        graph.clear();

        // 1. Create 25 Nodes (5x5 Grid)
        // Spacing: X from 100 to 900 (step 200), Y from 100 to 700 (step 150)
        double[] xCoords = {100, 300, 500, 700, 900};
        double[] yCoords = {100, 250, 400, 550, 700};

        String[] districtNames = {
                "North Shore", "Tech Corridor", "Civic Center", "Uptown", "Highland Park",
                "West Quarter", "Downtown Commercial", "Central Square", "Midtown", "East Vista",
                "Industrial Haven", "Medical Plaza", "Metro Core", "Financial District", "Harbor Heights",
                "South Gateway", "Arts District", "Riverside", "University District", "Innovation Zone",
                "Sunset Boulevard", "Southwest Sector", "Heritage District", "Terminal Junction", "Bayside"
        };

        Map<String, String> specialTypes = new HashMap<>();
        // Hospitals
        specialTypes.put("N3", "HOSPITAL");
        specialTypes.put("N13", "HOSPITAL");
        specialTypes.put("N23", "HOSPITAL");
        // Fire Stations
        specialTypes.put("N2", "FIRE_STATION");
        specialTypes.put("N22", "FIRE_STATION");
        // Police Stations
        specialTypes.put("N5", "POLICE_STATION");
        specialTypes.put("N21", "POLICE_STATION");
        // Key Landmarks
        specialTypes.put("N7", "COMMERCIAL_MALL");
        specialTypes.put("N9", "TECH_PARK");
        specialTypes.put("N11", "RESIDENTIAL");
        specialTypes.put("N15", "RESIDENTIAL");
        specialTypes.put("N17", "FINANCIAL_HUB");
        specialTypes.put("N19", "TRANSIT_STATION");

        Map<String, String> landmarkLabels = new HashMap<>();
        landmarkLabels.put("N3", "North Medical Trauma Center");
        landmarkLabels.put("N13", "Central General Hospital");
        landmarkLabels.put("N23", "South Health Institute");
        landmarkLabels.put("N2", "Fire Dept Station 1 (North)");
        landmarkLabels.put("N22", "Fire Dept Station 2 (Downtown)");
        landmarkLabels.put("N5", "Metro Police Central HQ");
        landmarkLabels.put("N21", "Sector 4 Police Precinct");
        landmarkLabels.put("N7", "Neo City Mega Mall");
        landmarkLabels.put("N9", "CyberTech Innovation Park");
        landmarkLabels.put("N11", "Emerald Heights Residential");
        landmarkLabels.put("N15", "Riverfront Luxury Condos");
        landmarkLabels.put("N17", "Global Financial Exchange");
        landmarkLabels.put("N19", "Grand Central Transit Hub");

        int nodeIndex = 1;
        for (int r = 0; r < 5; r++) {
            for (int c = 0; c < 5; c++) {
                String nodeId = "N" + nodeIndex;
                String district = districtNames[nodeIndex - 1];
                String type = specialTypes.getOrDefault(nodeId, "INTERSECTION");
                String name = landmarkLabels.getOrDefault(nodeId, "Junction " + nodeId + " (" + district + ")");

                GraphNode node = new GraphNode(nodeId, name, xCoords[c], yCoords[r], type, district);
                graph.addNode(node);

                // Register Stations & Landmarks in City Aggregate
                if ("HOSPITAL".equals(type)) {
                    city.registerEmergencyStation(name, nodeId);
                } else if ("FIRE_STATION".equals(type)) {
                    city.registerEmergencyStation(name, nodeId);
                } else if ("POLICE_STATION".equals(type)) {
                    city.registerEmergencyStation(name, nodeId);
                }
                if (landmarkLabels.containsKey(nodeId)) {
                    city.registerLandmark(nodeId, landmarkLabels.get(nodeId));
                }

                // Traffic Light
                TrafficLightState initialState = ((r + c) % 2 == 0) ? TrafficLightState.GREEN : TrafficLightState.RED;
                city.addTrafficLight(new TrafficLight(nodeId, initialState, 12.0, 3.0, 10.0));

                // Save to Database
                intersectionRepository.save(new IntersectionEntity(nodeId, name, xCoords[c], yCoords[r], type, district));
                nodeIndex++;
            }
        }

        // 2. Create Roads (Horizontal Grid Links)
        int roadCounter = 1;
        for (int r = 0; r < 5; r++) {
            for (int c = 0; c < 4; c++) {
                int u = r * 5 + c + 1;
                int v = u + 1;
                String roadId = "R" + roadCounter++;
                String name = "East-West Parkway " + r + "-" + c;
                graph.addBidirectionalRoad(roadId, name, "N" + u, "N" + v, 200.0, 60.0, 2);
                roadRepository.save(new RoadEntity(roadId, name, "N" + u, "N" + v, 200.0, 60.0, TrafficLevel.LOW, false, 2));
            }
        }

        // 3. Create Roads (Vertical Grid Links)
        for (int r = 0; r < 4; r++) {
            for (int c = 0; c < 5; c++) {
                int u = r * 5 + c + 1;
                int v = u + 5;
                String roadId = "R" + roadCounter++;
                String name = "North-South Boulevard " + r + "-" + c;
                graph.addBidirectionalRoad(roadId, name, "N" + u, "N" + v, 150.0, 50.0, 2);
                roadRepository.save(new RoadEntity(roadId, name, "N" + u, "N" + v, 150.0, 50.0, TrafficLevel.LOW, false, 2));
            }
        }

        // 4. Create Diagonal Expressways / Arterial Bypass Links
        // Northwest to Southeast Express Corridor
        graph.addBidirectionalRoad("R_EXP1", "Apex Diagonal Expressway", "N1", "N7", 250.0, 80.0, 3);
        graph.addBidirectionalRoad("R_EXP2", "Central Crossing Expressway", "N7", "N13", 250.0, 80.0, 3);
        graph.addBidirectionalRoad("R_EXP3", "South Cross Expressway", "N13", "N19", 250.0, 80.0, 3);
        graph.addBidirectionalRoad("R_EXP4", "Terminal Link Expressway", "N19", "N25", 250.0, 80.0, 3);
        // Northeast to Southwest Corridor
        graph.addBidirectionalRoad("R_EXP5", "Civic Diagonal Expressway", "N5", "N9", 250.0, 80.0, 3);
        graph.addBidirectionalRoad("R_EXP6", "Midtown Bypass", "N9", "N13", 250.0, 80.0, 3);
        graph.addBidirectionalRoad("R_EXP7", "Westview Rapid Link", "N13", "N17", 250.0, 80.0, 3);
        graph.addBidirectionalRoad("R_EXP8", "Harbor Express Bypass", "N17", "N21", 250.0, 80.0, 3);

        // 5. Initial Fleet: 0 vehicles on startup (user sends vehicles interactively via dispatch console)
        simulationEngine.logEvent("CITY_INITIALIZED",
                "City network successfully generated with 25 intersections and 48 roads. Ready for user vehicle dispatch.",
                "SYSTEM");
    }

    private void spawnAmbulance(String id, String name, String stationNodeId) {
        City city = simulationEngine.getCity();
        GraphNode node = city.getGraph().getNode(stationNodeId);
        if (node != null) {
            AbstractVehicle amb = VehicleFactory.createVehicle(
                    VehicleType.AMBULANCE, id, name, 65.0,
                    node.getX(), node.getY(), stationNodeId, stationNodeId
            );
            city.addVehicle(amb);
            vehicleRepository.save(new VehicleEntity(
                    id, name, VehicleType.AMBULANCE, 65.0,
                    node.getX(), node.getY(), stationNodeId, stationNodeId,
                    null, "IDLE", true
            ));
        }
    }

    private void spawnFireTruck(String id, String name, String stationNodeId) {
        City city = simulationEngine.getCity();
        GraphNode node = city.getGraph().getNode(stationNodeId);
        if (node != null) {
            AbstractVehicle fire = VehicleFactory.createVehicle(
                    VehicleType.FIRE_TRUCK, id, name, 55.0,
                    node.getX(), node.getY(), stationNodeId, stationNodeId
            );
            city.addVehicle(fire);
            vehicleRepository.save(new VehicleEntity(
                    id, name, VehicleType.FIRE_TRUCK, 55.0,
                    node.getX(), node.getY(), stationNodeId, stationNodeId,
                    null, "IDLE", true
            ));
        }
    }

    private void spawnPolice(String id, String name, String stationNodeId) {
        City city = simulationEngine.getCity();
        GraphNode node = city.getGraph().getNode(stationNodeId);
        if (node != null) {
            AbstractVehicle pol = VehicleFactory.createVehicle(
                    VehicleType.POLICE, id, name, 70.0,
                    node.getX(), node.getY(), stationNodeId, stationNodeId
            );
            city.addVehicle(pol);
            vehicleRepository.save(new VehicleEntity(
                    id, name, VehicleType.POLICE, 70.0,
                    node.getX(), node.getY(), stationNodeId, stationNodeId,
                    null, "IDLE", true
            ));
        }
    }
}
