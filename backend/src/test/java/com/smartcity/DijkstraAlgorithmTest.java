package com.smartcity;

import com.smartcity.algorithm.*;
import com.smartcity.model.enums.TrafficLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class DijkstraAlgorithmTest {

    private Graph graph;
    private DijkstraAlgorithm dijkstra;

    @BeforeEach
    void setUp() {
        graph = new Graph();
        dijkstra = new DijkstraAlgorithm();

        // Build network:
        // A -> B -> D (upper path: 100m + 100m = 200m)
        // A -> C -> D (lower path: 150m + 150m = 300m)
        graph.addNode(new GraphNode("A", "Node A", 0, 100, "INTERSECTION", "North"));
        graph.addNode(new GraphNode("B", "Node B", 100, 0, "INTERSECTION", "North"));
        graph.addNode(new GraphNode("C", "Node C", 100, 200, "INTERSECTION", "South"));
        graph.addNode(new GraphNode("D", "Node D", 200, 100, "INTERSECTION", "East"));

        graph.addBidirectionalRoad("R_AB", "Road AB", "A", "B", 100.0, 50.0, 2);
        graph.addBidirectionalRoad("R_BD", "Road BD", "B", "D", 100.0, 50.0, 2);
        graph.addBidirectionalRoad("R_AC", "Road AC", "A", "C", 150.0, 50.0, 2);
        graph.addBidirectionalRoad("R_CD", "Road CD", "C", "D", 150.0, 50.0, 2);
    }

    @Test
    void testBasicDijkstraPathfinding() {
        PathResult result = dijkstra.findPath(graph, "A", "D", false);
        assertTrue(result.isFound(), "Dijkstra should find shortest route from A to D");
        assertEquals(3, result.getNodeIds().size());
        assertEquals("A", result.getNodeIds().get(0));
        assertEquals("B", result.getNodeIds().get(1), "Dijkstra should pick shorter path through B (200m vs 300m)");
        assertEquals("D", result.getNodeIds().get(2));
        assertEquals(200.0, result.getTotalDistance(), 0.1);
    }

    @Test
    void testCongestionDiversion() {
        // Heavy congestion on upper path
        graph.updateTrafficLevel("R_AB_fwd", TrafficLevel.CRITICAL);
        graph.updateTrafficLevel("R_BD_fwd", TrafficLevel.CRITICAL);

        PathResult result = dijkstra.findPath(graph, "A", "D", false);
        assertTrue(result.isFound());
        assertEquals("C", result.getNodeIds().get(1), "Dijkstra should divert through C when B is congested");
    }

    @Test
    void testBlockedEdgeBypass() {
        // Block road through B
        graph.blockEdge("R_BD_fwd");

        PathResult result = dijkstra.findPath(graph, "A", "D", false);
        assertTrue(result.isFound());
        assertEquals("C", result.getNodeIds().get(1), "Dijkstra should route through C when B->D is blocked");
    }
}
