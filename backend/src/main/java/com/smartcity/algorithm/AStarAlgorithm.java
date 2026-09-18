package com.smartcity.algorithm;

import java.util.*;

/**
 * A* Pathfinding Algorithm Implementation for Smart City Traffic Routing.
 * Evaluates nodes using F(n) = G(n) + H(n), utilizing a PriorityQueue with custom Comparator,
 * Euclidean distance heuristic H(n), dynamic traffic weighting, and blocked-edge avoidance.
 */
public class AStarAlgorithm {

    /**
     * Inner record class used during priority-queue path evaluation.
     */
    private static class NodeRecord implements Comparable<NodeRecord> {
        final String nodeId;
        final double gScore; // Cost from start to current node
        final double fScore; // Estimated total cost (gScore + heuristic)
        final String incomingEdgeId;
        final NodeRecord parent;

        NodeRecord(String nodeId, double gScore, double fScore, String incomingEdgeId, NodeRecord parent) {
            this.nodeId = nodeId;
            this.gScore = gScore;
            this.fScore = fScore;
            this.incomingEdgeId = incomingEdgeId;
            this.parent = parent;
        }

        @Override
        public int compareTo(NodeRecord other) {
            return Double.compare(this.fScore, other.fScore);
        }
    }

    /**
     * Finds the optimal path from source to target node using A* algorithm.
     *
     * @param graph       The city graph
     * @param sourceId    Origin node ID
     * @param targetId    Destination node ID
     * @param isEmergency Whether emergency priority routing is applied
     * @return PathResult with traversed nodes, edges, distance, and travel time
     */
    public PathResult findPath(Graph graph, String sourceId, String targetId, boolean isEmergency) {
        return findPath(graph, sourceId, targetId, isEmergency, false);
    }

    /**
     * Finds the optimal path from source to target node using A* algorithm.
     *
     * @param graph        The city graph
     * @param sourceId     Origin node ID
     * @param targetId     Destination node ID
     * @param isEmergency  Whether emergency priority routing is applied
     * @param pureDistance Whether to calculate strictly based on physical distance (ignoring traffic congestion)
     * @return PathResult with traversed nodes, edges, distance, and travel time
     */
    public PathResult findPath(Graph graph, String sourceId, String targetId, boolean isEmergency, boolean pureDistance) {
        if (graph == null) {
            return PathResult.notFound("City graph is not initialized.");
        }

        GraphNode startNode = graph.getNode(sourceId);
        GraphNode targetNode = graph.getNode(targetId);

        if (startNode == null) {
            return PathResult.notFound("Source node '" + sourceId + "' does not exist.");
        }
        if (targetNode == null) {
            return PathResult.notFound("Target node '" + targetId + "' does not exist.");
        }

        if (sourceId.equals(targetId)) {
            PathResult sameNodeResult = new PathResult();
            sameNodeResult.setFound(true);
            sameNodeResult.getNodeIds().add(sourceId);
            sameNodeResult.getPathNodes().add(startNode);
            sameNodeResult.setTotalDistance(0.0);
            sameNodeResult.setEstimatedTravelTime(0.0);
            sameNodeResult.setMessage("Source and destination are identical.");
            return sameNodeResult;
        }

        // PriorityQueue ordered by fScore ascending
        PriorityQueue<NodeRecord> openQueue = new PriorityQueue<>();
        // Best known gScore for each node
        Map<String, Double> gScores = new HashMap<>();
        // Set of evaluated nodes
        Set<String> closedSet = new HashSet<>();

        double initialHeuristic = startNode.distanceTo(targetNode);
        openQueue.add(new NodeRecord(sourceId, 0.0, initialHeuristic, null, null));
        gScores.put(sourceId, 0.0);

        NodeRecord goalRecord = null;

        while (!openQueue.isEmpty()) {
            NodeRecord current = openQueue.poll();

            // If we reached the target, reconstruct path
            if (current.nodeId.equals(targetId)) {
                goalRecord = current;
                break;
            }

            // If already evaluated with a lower or equal score, skip
            if (closedSet.contains(current.nodeId)) {
                continue;
            }
            closedSet.add(current.nodeId);

            // Explore all outgoing roads/edges from current intersection
            List<GraphEdge> outgoingEdges = graph.getOutgoingEdges(current.nodeId);
            for (GraphEdge edge : outgoingEdges) {
                // Completely skip blocked roads (accidents, construction, closures)
                if (edge.isBlocked()) {
                    continue;
                }

                String neighborId = edge.getTargetNodeId();
                if (closedSet.contains(neighborId)) {
                    continue;
                }

                GraphNode neighborNode = graph.getNode(neighborId);
                if (neighborNode == null) {
                    continue;
                }

                // Calculate edge traversal cost (pure physical distance or traffic-weighted)
                double edgeCost = pureDistance ? edge.getDistance() : edge.calculateCost(isEmergency);
                double tentativeGScore = current.gScore + edgeCost;

                Double knownGScore = gScores.get(neighborId);
                if (knownGScore == null || tentativeGScore < knownGScore) {
                    gScores.put(neighborId, tentativeGScore);
                    double heuristic = neighborNode.distanceTo(targetNode);
                    double fScore = tentativeGScore + heuristic;
                    openQueue.add(new NodeRecord(neighborId, tentativeGScore, fScore, edge.getId(), current));
                }
            }
        }

        if (goalRecord == null) {
            return PathResult.notFound("No available route found from " + startNode.getName()
                    + " to " + targetNode.getName() + " (roads may be blocked or disconnected).");
        }

        // Reconstruct path from goal back to start
        return buildPathResult(graph, goalRecord, isEmergency);
    }

    private PathResult buildPathResult(Graph graph, NodeRecord goalRecord, boolean isEmergency) {
        LinkedList<String> nodeIds = new LinkedList<>();
        LinkedList<String> edgeIds = new LinkedList<>();
        LinkedList<GraphNode> pathNodes = new LinkedList<>();
        LinkedList<GraphEdge> pathEdges = new LinkedList<>();

        double totalDistance = 0.0;
        double totalTravelTime = 0.0;

        NodeRecord curr = goalRecord;
        while (curr != null) {
            nodeIds.addFirst(curr.nodeId);
            GraphNode node = graph.getNode(curr.nodeId);
            if (node != null) {
                pathNodes.addFirst(node);
            }

            if (curr.incomingEdgeId != null) {
                edgeIds.addFirst(curr.incomingEdgeId);
                GraphEdge edge = graph.getEdge(curr.incomingEdgeId);
                if (edge != null) {
                    pathEdges.addFirst(edge);
                    totalDistance += edge.getDistance();
                    totalTravelTime += edge.calculateTravelTimeSeconds();
                }
            }

            curr = curr.parent;
        }

        PathResult result = new PathResult();
        result.setFound(true);
        result.setNodeIds(nodeIds);
        result.setEdgeIds(edgeIds);
        result.setPathNodes(pathNodes);
        result.setPathEdges(pathEdges);
        result.setTotalDistance(Math.round(totalDistance * 10.0) / 10.0);
        result.setEstimatedTravelTime(Math.round(totalTravelTime * 10.0) / 10.0);
        result.setStrategy(isEmergency ? "A* Emergency Priority Routing" : "A* Standard Traffic-Aware Routing");
        result.setMessage("Optimal route successfully computed via A* algorithm (" + nodeIds.size() + " nodes).");
        return result;
    }
}
