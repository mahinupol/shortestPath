package com.smartcity.model.enums;

public enum EmergencyType {
    MEDICAL("Medical Emergency", VehicleType.AMBULANCE, "Hospital"),
    FIRE("Structural / Hazard Fire", VehicleType.FIRE_TRUCK, "Fire Station"),
    POLICE("Security / Traffic Incident", VehicleType.POLICE, "Police Station");

    private final String description;
    private final VehicleType requiredVehicleType;
    private final String originType;

    EmergencyType(String description, VehicleType requiredVehicleType, String originType) {
        this.description = description;
        this.requiredVehicleType = requiredVehicleType;
        this.originType = originType;
    }

    public String getDescription() {
        return description;
    }

    public VehicleType getRequiredVehicleType() {
        return requiredVehicleType;
    }

    public String getOriginType() {
        return originType;
    }
}
