package com.smartcity.algorithm;

import com.smartcity.model.enums.TrafficLevel;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * City Graph data structure managing nodes (intersections) and edges (roads).
 * Provides thread-safe methods for dynamic graph modification (blocking, restoring, traffic weighting).
 */
public class Graph {
    private final Map<String, GraphNode> nodes = new ConcurrentHashMap<>();
    private final Map<String, List<GraphEdge>> adjacencyList = new ConcurrentHashMap<>();
    private final Map<String, GraphEdge> edges = new ConcurrentHashMap<>();

    public void addNode(GraphNode node) {
        if (node != null && node.getId() != null) {
            nodes.put(node.getId(), node);
            adjacencyList.computeIfAbsent(node.getId(), k -> Collections.synchronizedList(new ArrayList<>()));
        }
    }

    public void addEdge(GraphEdge edge) {
        if (edge == null || edge.getId() == null) return;
        edges.put(edge.getId(), edge);
        adjacencyList.computeIfAbsent(edge.getSourceNodeId(), k -> Collections.synchronizedList(new ArrayList<>())).add(edge);
    }

    /**
     * Adds a bidirectional road with separate directional edges for realistic multi-lane traffic flow.
     */
    public void addBidirectionalRoad(String baseRoadId, String name, String nodeA, String nodeB,
                                     double distance, double speedLimit, int lanes) {
        GraphEdge edgeForward = new GraphEdge(baseRoadId + "_fwd", name, nodeA, nodeB, distance, speedLimit, lanes);
        GraphEdge edgeBackward = new GraphEdge(baseRoadId + "_rev", name + " (Rev)", nodeB, nodeA, distance, speedLimit, lanes);
        addEdge(edgeForward);
        addEdge(edgeBackward);
    }

    public GraphNode getNode(String nodeId) {
        return nodes.get(nodeId);
    }

    public GraphEdge getEdge(String edgeId) {
        return edges.get(edgeId);
    }

    public Collection<GraphNode> getAllNodes() {
        return Collections.unmodifiableCollection(nodes.values());
    }

    public Collection<GraphEdge> getAllEdges() {
        return Collections.unmodifiableCollection(edges.values());
    }

    public List<GraphEdge> getOutgoingEdges(String nodeId) {
        return adjacencyList.getOrDefault(nodeId, Collections.emptyList());
    }

    /**
     * Blocks a road segment and its reverse counterpart (if bidirectional).
     */
    public boolean blockEdge(String edgeId) {
        GraphEdge edge = edges.get(edgeId);
        if (edge == null) {
            // Check if base road ID was passed
            boolean found = false;
            for (GraphEdge e : edges.values()) {
                if (e.getId().startsWith(edgeId)) {
                    e.setBlocked(true);
                    found = true;
                }
            }
            return found;
        }

        edge.setBlocked(true);
        // Also block reverse counterpart if exists
        String counterpartId = edgeId.endsWith("_fwd") ? edgeId.replace("_fwd", "_rev")
                : (edgeId.endsWith("_rev") ? edgeId.replace("_rev", "_fwd") : null);
        if (counterpartId != null && edges.containsKey(counterpartId)) {
            edges.get(counterpartId).setBlocked(true);
        }
        return true;
    }

    /**
     * Restores a blocked road segment.
     */
    public boolean restoreEdge(String edgeId) {
        GraphEdge edge = edges.get(edgeId);
        if (edge == null) {
            boolean found = false;
            for (GraphEdge e : edges.values()) {
                if (e.getId().startsWith(edgeId)) {
                    e.setBlocked(false);
                    found = true;
                }
            }
            return found;
        }

        edge.setBlocked(false);
        String counterpartId = edgeId.endsWith("_fwd") ? edgeId.replace("_fwd", "_rev")
                : (edgeId.endsWith("_rev") ? edgeId.replace("_rev", "_fwd") : null);
        if (counterpartId != null && edges.containsKey(counterpartId)) {
            edges.get(counterpartId).setBlocked(false);
        }
        return true;
    }

    /**
     * Updates traffic level for a road and its counterpart.
     */
    public boolean updateTrafficLevel(String edgeId, TrafficLevel level) {
        GraphEdge edge = edges.get(edgeId);
        if (edge == null) {
            boolean found = false;
            for (GraphEdge e : edges.values()) {
                if (e.getId().startsWith(edgeId)) {
                    e.setTrafficLevel(level);
                    found = true;
                }
            }
            return found;
        }

        edge.setTrafficLevel(level);
        String counterpartId = edgeId.endsWith("_fwd") ? edgeId.replace("_fwd", "_rev")
                : (edgeId.endsWith("_rev") ? edgeId.replace("_rev", "_fwd") : null);
        if (counterpartId != null && edges.containsKey(counterpartId)) {
            edges.get(counterpartId).setTrafficLevel(level);
        }
        return true;
    }

    public void clear() {
        nodes.clear();
        adjacencyList.clear();
        edges.clear();
    }
}
