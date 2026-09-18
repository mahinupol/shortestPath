package com.smartcity.patterns.strategy;

import com.smartcity.algorithm.Graph;
import com.smartcity.algorithm.PathResult;

/**
 * Strategy pattern interface for route calculation algorithms.
 * Allows runtime switching between different routing strategies.
 */
public interface RouteStrategy {
    PathResult calculateRoute(Graph graph, String sourceId, String destinationId);
    String getStrategyName();
}
