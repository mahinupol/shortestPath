package com.smartcity.model.core;

import com.smartcity.model.enums.EmergencyType;
import com.smartcity.model.enums.VehicleType;

/**
 * Concrete Emergency Vehicle: Police Patrol Cruiser.
 * Dispatched from Police Stations for traffic incidents, road closures, and emergency security.
 */
public class PoliceVehicle extends EmergencyVehicle {
    private int incidentsResolved = 0;

    public PoliceVehicle(String id, String name, double baseSpeed,
                         double startX, double startY, String initialNodeId, String policeStationNodeId) {
        super(id, name, VehicleType.POLICE, baseSpeed, startX, startY, initialNodeId, policeStationNodeId);
    }

    @Override
    public int calculatePriority() {
        return 8; // High priority interceptor
    }

    @Override
    public double getSpeedMultiplier() {
        return 1.45; // High acceleration & pursuit speed
    }

    @Override
    public String getVehicleIcon() {
        return "police";
    }

    @Override
    public EmergencyType getEmergencyType() {
        return EmergencyType.POLICE;
    }

    public int getIncidentsResolved() {
        return incidentsResolved;
    }

    public void incrementIncidentsResolved() {
        this.incidentsResolved++;
    }
}
