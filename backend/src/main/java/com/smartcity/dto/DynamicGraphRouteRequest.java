package com.smartcity.dto;

import com.smartcity.algorithm.GraphEdge;
import com.smartcity.algorithm.GraphNode;

import java.util.ArrayList;
import java.util.List;

/**
 * Request payload for calculating optimal routes across dynamically extracted real-world road networks.
 */
public class DynamicGraphRouteRequest {
    private List<GraphNode> nodes = new ArrayList<>();
    private List<GraphEdge> edges = new ArrayList<>();
    private String sourceNodeId;
    private String targetNodeId;
    private String strategy; // "ASTAR", "DIJKSTRA", "SHORTEST", "FASTEST", "EMERGENCY"
    private boolean isEmergency;

    public DynamicGraphRouteRequest() {
    }

    public DynamicGraphRouteRequest(List<GraphNode> nodes, List<GraphEdge> edges,
                                   String sourceNodeId, String targetNodeId,
                                   String strategy, boolean isEmergency) {
        this.nodes = nodes != null ? nodes : new ArrayList<>();
        this.edges = edges != null ? edges : new ArrayList<>();
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.strategy = strategy;
        this.isEmergency = isEmergency;
    }

    public List<GraphNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<GraphNode> nodes) {
        this.nodes = nodes;
    }

    public List<GraphEdge> getEdges() {
        return edges;
    }

    public void setEdges(List<GraphEdge> edges) {
        this.edges = edges;
    }

    public String getSourceNodeId() {
        return sourceNodeId;
    }

    public void setSourceNodeId(String sourceNodeId) {
        this.sourceNodeId = sourceNodeId;
    }

    public String getTargetNodeId() {
        return targetNodeId;
    }

    public void setTargetNodeId(String targetNodeId) {
        this.targetNodeId = targetNodeId;
    }

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public boolean isEmergency() {
        return isEmergency;
    }

    public void setEmergency(boolean emergency) {
        isEmergency = emergency;
    }
}
