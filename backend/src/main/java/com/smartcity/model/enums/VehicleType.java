package com.smartcity.model.enums;

public enum VehicleType {
    CAR("Normal Car", false, 1),
    AMBULANCE("Ambulance", true, 9),
    FIRE_TRUCK("Fire Truck", true, 10),
    POLICE("Police Patrol", true, 8);

    private final String displayName;
    private final boolean emergency;
    private final int defaultPriority;

    VehicleType(String displayName, boolean emergency, int defaultPriority) {
        this.displayName = displayName;
        this.emergency = emergency;
        this.defaultPriority = defaultPriority;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isEmergency() {
        return emergency;
    }

    public int getDefaultPriority() {
        return defaultPriority;
    }
}
