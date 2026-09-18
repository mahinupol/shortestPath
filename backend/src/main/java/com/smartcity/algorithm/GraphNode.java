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
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
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
