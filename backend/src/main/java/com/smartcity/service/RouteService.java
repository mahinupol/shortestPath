package com.smartcity.service;

import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.GraphEdge;
import com.smartcity.algorithm.GraphNode;
import com.smartcity.algorithm.PathResult;
import com.smartcity.dto.DynamicGraphRouteRequest;
import com.smartcity.dto.RouteCalculationRequest;
import com.smartcity.patterns.strategy.DijkstraStrategy;
import com.smartcity.patterns.strategy.EmergencyPriorityRouteStrategy;
import com.smartcity.patterns.strategy.FastestTimeStrategy;
import com.smartcity.patterns.strategy.RouteStrategy;
import com.smartcity.patterns.strategy.ShortestDistanceStrategy;
import com.smartcity.simulation.SimulationEngine;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RouteService {

    private final SimulationEngine simulationEngine;
    private final Map<String, RouteStrategy> strategies = new HashMap<>();

    public RouteService(SimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
        RouteStrategy fastest = new FastestTimeStrategy();
        RouteStrategy shortest = new ShortestDistanceStrategy();
        RouteStrategy dijkstra = new DijkstraStrategy();
        RouteStrategy emergency = new EmergencyPriorityRouteStrategy();

        strategies.put("FASTEST", fastest);
        strategies.put("ASTAR", shortest);
        strategies.put("SHORTEST", shortest);
        strategies.put("ASTAR_TRAFFIC", fastest);
        strategies.put("DIJKSTRA", dijkstra);
        strategies.put("EMERGENCY", emergency);
    }

    public PathResult calculateRoute(RouteCalculationRequest request) {
        if (request == null || request.getSourceNodeId() == null || request.getTargetNodeId() == null) {
            throw new IllegalArgumentException("Source and target intersections must be provided.");
        }

        String strategyKey = request.getStrategy() != null ? request.getStrategy().toUpperCase() : (request.isEmergency() ? "EMERGENCY" : "ASTAR");
        RouteStrategy strategy = strategies.getOrDefault(strategyKey, strategies.get("ASTAR"));

        Graph graph = simulationEngine.getCity().getGraph();
        PathResult result = strategy.calculateRoute(graph, request.getSourceNodeId(), request.getTargetNodeId());

        if (result.isFound()) {
            simulationEngine.logEvent("ROUTE_CALCULATED",
                    "A* Route computed: " + request.getSourceNodeId() + " -> " + request.getTargetNodeId()
                            + " via " + strategy.getStrategyName() + " (" + result.getTotalDistance() + "m)",
                    request.getSourceNodeId() + "-" + request.getTargetNodeId());
        }

        return result;
    }

    public PathResult calculateDynamicRoute(DynamicGraphRouteRequest request) {
        if (request == null || request.getSourceNodeId() == null || request.getTargetNodeId() == null) {
            throw new IllegalArgumentException("Source and target nodes must be provided.");
        }

        String strategyKey = request.getStrategy() != null ? request.getStrategy().toUpperCase() : (request.isEmergency() ? "EMERGENCY" : "ASTAR");
        RouteStrategy strategy = strategies.getOrDefault(strategyKey, strategies.get("ASTAR"));

        Graph dynamicGraph = new Graph();
        if (request.getNodes() != null) {
            for (GraphNode node : request.getNodes()) {
                dynamicGraph.addNode(node);
            }
        }
        if (request.getEdges() != null) {
            for (GraphEdge edge : request.getEdges()) {
                dynamicGraph.addEdge(edge);

                // Ensure every road segment counts as both a going and coming path
                String revId = edge.getId() + "_twoway_rev";
                if (!edge.getId().endsWith("_rev") && dynamicGraph.getEdge(revId) == null) {
                    GraphEdge rev = new GraphEdge(revId, edge.getName(), edge.getTargetNodeId(), edge.getSourceNodeId(),
                            edge.getDistance(), edge.getSpeedLimit(), edge.getLanes());
                    rev.setBlocked(edge.isBlocked());
                    rev.setTrafficLevel(edge.getTrafficLevel());
                    dynamicGraph.addEdge(rev);
                }
            }
        }

        long startTime = System.nanoTime();
        PathResult result = strategy.calculateRoute(dynamicGraph, request.getSourceNodeId(), request.getTargetNodeId());
        long elapsedNanos = System.nanoTime() - startTime;
        double elapsedMs = Math.round((elapsedNanos / 1_000_000.0) * 100.0) / 100.0;

        if (result.isFound()) {
            result.setMessage(result.getMessage() + " [Dynamic Graph Solved in " + elapsedMs + "ms]");
        }

        return result;
    }
}
