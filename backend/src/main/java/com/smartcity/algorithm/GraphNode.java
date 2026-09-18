package com.smartcity.algorithm;

import java.util.Objects;

/**
 * Represents a node (intersection, landmark, or emergency depot) in the city graph.
 * Encapsulates spatial coordinates and location metadata.
 */
public class GraphNode {
    private String id;
    private String name;
    private double x;
    private double y;
    private String type;
    private String district;

    public GraphNode() {
    }

    public GraphNode(String id, String name, double x, double y, String type, String district) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.type = type;
        this.district = district;
    }

    public double distanceTo(GraphNode other) {
        if (other == null) return 0.0;
        // Check if coordinates appear to be geographic (lat/long in degrees)
        if (Math.abs(this.x) <= 180.0 && Math.abs(this.y) <= 90.0 &&
            Math.abs(other.x) <= 180.0 && Math.abs(other.y) <= 90.0 &&
            (this.x != 0.0 || this.y != 0.0)) {
            return haversineDistanceMeters(other);
        }
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public double haversineDistanceMeters(GraphNode other) {
        if (other == null) return 0.0;
        double R = 6371000.0; // Earth's mean radius in meters
        double dLat = Math.toRadians(other.y - this.y);
        double dLon = Math.toRadians(other.x - this.x);
        double lat1 = Math.toRadians(this.y);
        double lat2 = Math.toRadians(other.y);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
                   Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0) * Math.cos(lat1) * Math.cos(lat2);
        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return R * c;
    }

    public double[] getCoordinates() {
        return new double[]{this.x, this.y};
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GraphNode graphNode = (GraphNode) o;
        return Objects.equals(id, graphNode.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "GraphNode{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", (" + x + ", " + y + ")" +
                ", type='" + type + '\'' +
                '}';
    }
}
