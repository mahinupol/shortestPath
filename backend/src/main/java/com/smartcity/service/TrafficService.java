package com.smartcity.service;

import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.GraphEdge;
import com.smartcity.dto.RoadDTO;
import com.smartcity.exception.RoadBlockedException;
import com.smartcity.model.enums.TrafficLevel;
import com.smartcity.simulation.SimulationEngine;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class TrafficService {

    private final SimulationEngine simulationEngine;
    private final Random random = new Random();

    public TrafficService(SimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
    }

    public List<RoadDTO> getAllRoads() {
        Graph graph = simulationEngine.getCity().getGraph();
        List<RoadDTO> dtos = new ArrayList<>();
        for (GraphEdge edge : graph.getAllEdges()) {
            dtos.add(RoadDTO.fromDomain(edge));
        }
        return dtos;
    }

    public RoadDTO blockRoad(String roadId) {
        Graph graph = simulationEngine.getCity().getGraph();
        GraphEdge edge = graph.getEdge(roadId);
        if (edge == null) {
            throw new IllegalArgumentException("Road segment '" + roadId + "' does not exist.");
        }

        TrafficLevel oldLevel = edge.getTrafficLevel();
        graph.blockEdge(roadId);
        simulationEngine.getTrafficSubject().notifyTrafficChanged(roadId, oldLevel, oldLevel, true);

        return RoadDTO.fromDomain(edge);
    }

    public RoadDTO restoreRoad(String roadId) {
        Graph graph = simulationEngine.getCity().getGraph();
        GraphEdge edge = graph.getEdge(roadId);
        if (edge == null) {
            throw new IllegalArgumentException("Road segment '" + roadId + "' does not exist.");
        }

        graph.restoreEdge(roadId);
        simulationEngine.getTrafficSubject().notifyTrafficChanged(roadId, edge.getTrafficLevel(), TrafficLevel.LOW, false);
        simulationEngine.logEvent("ROAD_RESTORED", "Road " + edge.getName() + " has been reopened to traffic.", roadId);

        return RoadDTO.fromDomain(edge);
    }

    public RoadDTO updateTraffic(String roadId, TrafficLevel newLevel) {
        Graph graph = simulationEngine.getCity().getGraph();
        GraphEdge edge = graph.getEdge(roadId);
        if (edge == null) {
            throw new IllegalArgumentException("Road segment '" + roadId + "' does not exist.");
        }

        TrafficLevel oldLevel = edge.getTrafficLevel();
        graph.updateTrafficLevel(roadId, newLevel);
        simulationEngine.getTrafficSubject().notifyTrafficChanged(roadId, oldLevel, newLevel, edge.isBlocked());

        return RoadDTO.fromDomain(edge);
    }

    /**
     * Simulates an unexpected traffic accident on a random road segment.
     * Increases traffic congestion, temporarily blocks the road, and initiates dynamic A* rerouting.
     */
    public RoadDTO simulateAccident() {
        Graph graph = simulationEngine.getCity().getGraph();
        List<GraphEdge> unblockedEdges = new ArrayList<>();
        for (GraphEdge e : graph.getAllEdges()) {
            if (!e.isBlocked()) {
                unblockedEdges.add(e);
            }
        }

        if (unblockedEdges.isEmpty()) {
            throw new RoadBlockedException("ALL", "All roads are already blocked.");
        }

        GraphEdge selectedEdge = unblockedEdges.get(random.nextInt(unblockedEdges.size()));
        selectedEdge.setTrafficLevel(TrafficLevel.CRITICAL);
        graph.blockEdge(selectedEdge.getId());

        simulationEngine.logEvent("ACCIDENT_DETECTED",
                "Severe accident reported on " + selectedEdge.getName() + " between "
                        + selectedEdge.getSourceNodeId() + " and " + selectedEdge.getTargetNodeId()
                        + " — Emergency route recalculation initiated.",
                selectedEdge.getId());

        simulationEngine.getTrafficSubject().notifyTrafficChanged(
                selectedEdge.getId(), TrafficLevel.LOW, TrafficLevel.CRITICAL, true
        );

        return RoadDTO.fromDomain(selectedEdge);
    }

    /**
     * Randomizes traffic levels across the city network to simulate heavy rush-hour conditions.
     */
    public void generateRushHourTraffic() {
        Graph graph = simulationEngine.getCity().getGraph();
        TrafficLevel[] levels = {TrafficLevel.LOW, TrafficLevel.MEDIUM, TrafficLevel.HIGH, TrafficLevel.CRITICAL};

        for (GraphEdge edge : graph.getAllEdges()) {
            if (!edge.isBlocked()) {
                // Bias toward medium and high during rush hour
                int idx = random.nextInt(10);
                TrafficLevel lvl = idx < 2 ? TrafficLevel.LOW : (idx < 6 ? TrafficLevel.MEDIUM : (idx < 9 ? TrafficLevel.HIGH : TrafficLevel.CRITICAL));
                edge.setTrafficLevel(lvl);
            }
        }

        simulationEngine.logEvent("RUSH_HOUR_TRIGGERED",
                "Rush-hour conditions generated: city congestion levels elevated across all sectors.",
                "SYSTEM");
    }
}
