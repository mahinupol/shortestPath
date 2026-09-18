package com.smartcity.patterns.strategy;

import com.smartcity.algorithm.AStarAlgorithm;
import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.PathResult;

/**
 * Concrete Strategy: Calculates the physically shortest spatial path between intersections.
 */
public class ShortestDistanceStrategy implements RouteStrategy {
    private final AStarAlgorithm aStarAlgorithm = new AStarAlgorithm();

    @Override
    public PathResult calculateRoute(Graph graph, String sourceId, String destinationId) {
        PathResult result = aStarAlgorithm.findPath(graph, sourceId, destinationId, false);
        result.setStrategy(getStrategyName());
        return result;
    }

    @Override
    public String getStrategyName() {
        return "Shortest Distance Strategy";
    }
}
