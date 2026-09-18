package com.smartcity.model.core;

import com.smartcity.model.enums.EmergencyType;
import com.smartcity.model.enums.VehicleType;

/**
 * Abstract class representing emergency first-responder units.
 * Encapsulates sirens, active emergency linkages, station depots, and traffic signal preemption.
 */
public abstract class EmergencyVehicle extends AbstractVehicle {
    private boolean sirenActive;
    private String activeEmergencyId;
    private String homeStationId;

    public EmergencyVehicle(String id, String name, VehicleType type, double baseSpeed,
                            double startX, double startY, String initialNodeId, String homeStationId) {
        super(id, name, type, baseSpeed, startX, startY, initialNodeId);
        this.homeStationId = homeStationId;
        this.sirenActive = true;
    }

    @Override
    public boolean canPreemptTrafficLights() {
        // Active emergency vehicles trigger green corridors
        return sirenActive;
    }

    public abstract EmergencyType getEmergencyType();

    public boolean isSirenActive() {
        return sirenActive;
    }

    public void setSirenActive(boolean sirenActive) {
        this.sirenActive = sirenActive;
    }

    public String getActiveEmergencyId() {
        return activeEmergencyId;
    }

    public void setActiveEmergencyId(String activeEmergencyId) {
        this.activeEmergencyId = activeEmergencyId;
        this.sirenActive = (activeEmergencyId != null);
    }

    public String getHomeStationId() {
        return homeStationId;
    }

    public void setHomeStationId(String homeStationId) {
        this.homeStationId = homeStationId;
    }
}
