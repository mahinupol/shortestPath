package com.smartcity.patterns.strategy;

import com.smartcity.algorithm.AStarAlgorithm;
import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.PathResult;

/**
 * Concrete Strategy: Calculates emergency priority routes for Ambulances, Fire Trucks, and Police.
 * Applies emergency preemption discounts, avoids critical bottlenecks, and calculates fastest response corridor.
 */
public class EmergencyPriorityRouteStrategy implements RouteStrategy {
    private final AStarAlgorithm aStarAlgorithm = new AStarAlgorithm();

    @Override
    public PathResult calculateRoute(Graph graph, String sourceId, String destinationId) {
        PathResult result = aStarAlgorithm.findPath(graph, sourceId, destinationId, true);
        result.setStrategy(getStrategyName());
        return result;
    }

    @Override
    public String getStrategyName() {
        return "Emergency Priority Corridor Strategy";
    }
}
