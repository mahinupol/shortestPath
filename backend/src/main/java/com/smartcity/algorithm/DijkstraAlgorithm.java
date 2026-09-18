package com.smartcity.algorithm;

import java.util.*;

/**
 * Dijkstra's Shortest Path Algorithm for Smart City Road Network.
 * Classic uniform-cost search without heuristic (h(n) = 0), exploring nodes
 * strictly by minimal cumulative cost from the origin using a PriorityQueue.
 * Handles dynamic traffic weights and avoids blocked roads.
 */
public class DijkstraAlgorithm {

    private static class DijkstraNodeRecord implements Comparable<DijkstraNodeRecord> {
        final String nodeId;
        final double distance; // Cumulative distance / cost from source
        final String incomingEdgeId;
        final DijkstraNodeRecord parent;

        DijkstraNodeRecord(String nodeId, double distance, String incomingEdgeId, DijkstraNodeRecord parent) {
            this.nodeId = nodeId;
            this.distance = distance;
            this.incomingEdgeId = incomingEdgeId;
            this.parent = parent;
        }

        @Override
        public int compareTo(DijkstraNodeRecord other) {
            return Double.compare(this.distance, other.distance);
        }
    }

    /**
     * Finds shortest path using Dijkstra's Algorithm.
     *
     * @param graph       The road network graph
     * @param sourceId    Origin intersection ID
     * @param targetId    Destination intersection ID
     * @param isEmergency Whether emergency priority calculation is used
     * @return PathResult with path nodes, edges, distance, and travel time
     */
    public PathResult findPath(Graph graph, String sourceId, String targetId, boolean isEmergency) {
        if (graph == null) {
            return PathResult.notFound("City graph is not initialized.");
        }

        GraphNode startNode = graph.getNode(sourceId);
        GraphNode targetNode = graph.getNode(targetId);

        if (startNode == null) {
            return PathResult.notFound("Source intersection '" + sourceId + "' does not exist.");
        }
        if (targetNode == null) {
            return PathResult.notFound("Target intersection '" + targetId + "' does not exist.");
        }

        if (sourceId.equals(targetId)) {
            PathResult sameNodeResult = new PathResult();
            sameNodeResult.setFound(true);
            sameNodeResult.getNodeIds().add(sourceId);
            sameNodeResult.getPathNodes().add(startNode);
            sameNodeResult.setTotalDistance(0.0);
            sameNodeResult.setEstimatedTravelTime(0.0);
            sameNodeResult.setStrategy("Dijkstra's Algorithm");
            sameNodeResult.setMessage("Source and destination are identical.");
            return sameNodeResult;
        }

        PriorityQueue<DijkstraNodeRecord> queue = new PriorityQueue<>();
        Map<String, Double> distances = new HashMap<>();
        Set<String> visited = new HashSet<>();

        queue.add(new DijkstraNodeRecord(sourceId, 0.0, null, null));
        distances.put(sourceId, 0.0);

        DijkstraNodeRecord goalRecord = null;

        while (!queue.isEmpty()) {
            DijkstraNodeRecord current = queue.poll();

            if (current.nodeId.equals(targetId)) {
                goalRecord = current;
                break;
            }

            if (visited.contains(current.nodeId)) {
                continue;
            }
            visited.add(current.nodeId);

            List<GraphEdge> outgoingEdges = graph.getOutgoingEdges(current.nodeId);
            for (GraphEdge edge : outgoingEdges) {
                if (edge.isBlocked()) {
                    continue;
                }

                String neighborId = edge.getTargetNodeId();
                if (visited.contains(neighborId)) {
                    continue;
                }

                double edgeCost = edge.calculateCost(isEmergency);
                double newDist = current.distance + edgeCost;

                Double knownDist = distances.get(neighborId);
                if (knownDist == null || newDist < knownDist) {
                    distances.put(neighborId, newDist);
                    queue.add(new DijkstraNodeRecord(neighborId, newDist, edge.getId(), current));
                }
            }
        }

        if (goalRecord == null) {
            return PathResult.notFound("No path found via Dijkstra from " + startNode.getName()
                    + " to " + targetNode.getName() + " (roads may be blocked).");
        }

        return buildPathResult(graph, goalRecord);
    }

    private PathResult buildPathResult(Graph graph, DijkstraNodeRecord goalRecord) {
        LinkedList<String> nodeIds = new LinkedList<>();
        LinkedList<String> edgeIds = new LinkedList<>();
        LinkedList<GraphNode> pathNodes = new LinkedList<>();
        LinkedList<GraphEdge> pathEdges = new LinkedList<>();

        double totalDistance = 0.0;
        double totalTravelTime = 0.0;

        DijkstraNodeRecord curr = goalRecord;
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
        result.setStrategy("Dijkstra's Algorithm");
        result.setMessage("Shortest path computed via Dijkstra's Algorithm (" + nodeIds.size() + " intersections).");
        return result;
    }
}
