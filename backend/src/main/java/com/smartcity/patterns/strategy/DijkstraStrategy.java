package com.smartcity.patterns.strategy;

import com.smartcity.algorithm.DijkstraAlgorithm;
import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.PathResult;

/**
 * Concrete Strategy: Calculates the shortest route using Dijkstra's Algorithm (uniform cost search).
 */
public class DijkstraStrategy implements RouteStrategy {
    private final DijkstraAlgorithm dijkstraAlgorithm = new DijkstraAlgorithm();

    @Override
    public PathResult calculateRoute(Graph graph, String sourceId, String destinationId) {
        PathResult result = dijkstraAlgorithm.findPath(graph, sourceId, destinationId, false);
        result.setStrategy(getStrategyName());
        return result;
    }

    @Override
    public String getStrategyName() {
        return "Dijkstra's Shortest Path Strategy";
    }
}
