package com.smartcity.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "intersections")
public class IntersectionEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    private double x;
    private double y;

    private String type;
    private String district;

    public IntersectionEntity() {
    }

    public IntersectionEntity(String id, String name, double x, double y, String type, String district) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.type = type;
        this.district = district;
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
}
