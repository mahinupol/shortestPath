package com.smartcity;

import com.smartcity.algorithm.*;
import com.smartcity.model.enums.TrafficLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AStarAlgorithmTest {

    private Graph graph;
    private AStarAlgorithm aStar;

    @BeforeEach
    void setUp() {
        graph = new Graph();
        aStar = new AStarAlgorithm();

        // Build a diamond network:
        // A -> B -> D (upper path, 200m)
        // A -> C -> D (lower path, 200m)
        graph.addNode(new GraphNode("A", "Node A", 0, 100, "INTERSECTION", "North"));
        graph.addNode(new GraphNode("B", "Node B", 100, 0, "INTERSECTION", "North"));
        graph.addNode(new GraphNode("C", "Node C", 100, 200, "INTERSECTION", "South"));
        graph.addNode(new GraphNode("D", "Node D", 200, 100, "INTERSECTION", "East"));

        graph.addBidirectionalRoad("R_AB", "Road AB", "A", "B", 100.0, 50.0, 2);
        graph.addBidirectionalRoad("R_BD", "Road BD", "B", "D", 100.0, 50.0, 2);
        graph.addBidirectionalRoad("R_AC", "Road AC", "A", "C", 100.0, 50.0, 2);
        graph.addBidirectionalRoad("R_CD", "Road CD", "C", "D", 100.0, 50.0, 2);
    }

    @Test
    void testBasicPathfinding() {
        PathResult result = aStar.findPath(graph, "A", "D", false);
        assertTrue(result.isFound(), "Route should be found from A to D");
        assertEquals(3, result.getNodeIds().size(), "Path should traverse 3 nodes: A -> B/C -> D");
        assertEquals("A", result.getNodeIds().get(0));
        assertEquals("D", result.getNodeIds().get(2));
        assertEquals(200.0, result.getTotalDistance(), 0.1);
    }

    @Test
    void testCongestionAvoidance() {
        // Spiking traffic on B's roads to CRITICAL (multiplier 8.0)
        graph.updateTrafficLevel("R_AB_fwd", TrafficLevel.CRITICAL);
        graph.updateTrafficLevel("R_BD_fwd", TrafficLevel.CRITICAL);

        PathResult result = aStar.findPath(graph, "A", "D", false);
        assertTrue(result.isFound());
        // A* should choose the lower path through C to avoid critical congestion
        assertEquals("C", result.getNodeIds().get(1), "A* should choose clear path through node C");
    }

    @Test
    void testBlockedRoadAvoidance() {
        // Block road B->D
        graph.blockEdge("R_BD_fwd");

        PathResult result = aStar.findPath(graph, "A", "D", false);
        assertTrue(result.isFound());
        assertEquals("C", result.getNodeIds().get(1), "Path must bypass blocked road and go through C");
    }

    @Test
    void testCompletelyDisconnectedRoute() {
        // Block both paths to D
        graph.blockEdge("R_BD_fwd");
        graph.blockEdge("R_CD_fwd");

        PathResult result = aStar.findPath(graph, "A", "D", false);
        assertFalse(result.isFound(), "No route should be found when all connecting edges are blocked");
    }
}
