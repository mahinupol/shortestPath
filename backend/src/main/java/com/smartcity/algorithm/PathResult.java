package com.smartcity.algorithm;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of a pathfinding query containing computed route coordinates, road sequences,
 * cumulative distance, and estimated travel time.
 */
public class PathResult {
    private boolean found;
    private List<String> nodeIds;
    private List<String> edgeIds;
    private List<GraphNode> pathNodes;
    private List<GraphEdge> pathEdges;
    private double totalDistance;
    private double estimatedTravelTime;
    private String strategy;
    private String message;

    public PathResult() {
        this.found = false;
        this.nodeIds = new ArrayList<>();
        this.edgeIds = new ArrayList<>();
        this.pathNodes = new ArrayList<>();
        this.pathEdges = new ArrayList<>();
        this.totalDistance = 0.0;
        this.estimatedTravelTime = 0.0;
        this.strategy = "A*";
    }

    public static PathResult notFound(String message) {
        PathResult result = new PathResult();
        result.setFound(false);
        result.setMessage(message);
        return result;
    }

    public boolean isFound() {
        return found;
    }

    public void setFound(boolean found) {
        this.found = found;
    }

    public List<String> getNodeIds() {
        return nodeIds;
    }

    public void setNodeIds(List<String> nodeIds) {
        this.nodeIds = nodeIds;
    }

    public List<String> getEdgeIds() {
        return edgeIds;
    }

    public void setEdgeIds(List<String> edgeIds) {
        this.edgeIds = edgeIds;
    }

    public List<GraphNode> getPathNodes() {
        return pathNodes;
    }

    public void setPathNodes(List<GraphNode> pathNodes) {
        this.pathNodes = pathNodes;
    }

    public List<GraphEdge> getPathEdges() {
        return pathEdges;
    }

    public void setPathEdges(List<GraphEdge> pathEdges) {
        this.pathEdges = pathEdges;
    }

    public double getTotalDistance() {
        return totalDistance;
    }

    public void setTotalDistance(double totalDistance) {
        this.totalDistance = totalDistance;
    }

    public double getEstimatedTravelTime() {
        return estimatedTravelTime;
    }

    public void setEstimatedTravelTime(double estimatedTravelTime) {
        this.estimatedTravelTime = estimatedTravelTime;
    }

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
