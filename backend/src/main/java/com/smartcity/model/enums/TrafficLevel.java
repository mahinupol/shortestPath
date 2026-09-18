package com.smartcity.model.enums;

public enum TrafficLevel {
    LOW("Low Traffic", 1.0, 1, "#10b981"),
    MEDIUM("Medium Traffic", 2.0, 2, "#f59e0b"),
    HIGH("High Traffic", 4.0, 4, "#f97316"),
    CRITICAL("Critical Congestion", 8.0, 8, "#ef4444");

    private final String description;
    private final double costMultiplier;
    private final int baseWeight;
    private final String colorHex;

    TrafficLevel(String description, double costMultiplier, int baseWeight, String colorHex) {
        this.description = description;
        this.costMultiplier = costMultiplier;
        this.baseWeight = baseWeight;
        this.colorHex = colorHex;
    }

    public String getDescription() {
        return description;
    }

    public double getCostMultiplier() {
        return costMultiplier;
    }

    public int getBaseWeight() {
        return baseWeight;
    }

    public String getColorHex() {
        return colorHex;
    }
}
