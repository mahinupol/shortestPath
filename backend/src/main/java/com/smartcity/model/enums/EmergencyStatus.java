package com.smartcity.model.enums;

public enum EmergencyStatus {
    PENDING("Awaiting Dispatch"),
    DISPATCHED("Vehicle Dispatched"),
    EN_ROUTE("En Route to Scene"),
    ARRIVED("Arrived on Scene"),
    RESOLVED("Incident Resolved");

    private final String label;

    EmergencyStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
