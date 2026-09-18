package com.smartcity.model.core;

import com.smartcity.model.enums.EmergencyType;
import com.smartcity.model.enums.VehicleType;

/**
 * Concrete Emergency Vehicle: Ambulance.
 * Dispatched from Hospitals for trauma/medical emergencies.
 */
public class Ambulance extends EmergencyVehicle {
    private int patientsTransported = 0;

    public Ambulance(String id, String name, double baseSpeed,
                     double startX, double startY, String initialNodeId, String hospitalNodeId) {
        super(id, name, VehicleType.AMBULANCE, baseSpeed, startX, startY, initialNodeId, hospitalNodeId);
    }

    @Override
    public int calculatePriority() {
        return 9; // High medical response priority
    }

    @Override
    public double getSpeedMultiplier() {
        return 1.35; // Rapid transit capability
    }

    @Override
    public String getVehicleIcon() {
        return "ambulance";
    }

    @Override
    public EmergencyType getEmergencyType() {
        return EmergencyType.MEDICAL;
    }

    public int getPatientsTransported() {
        return patientsTransported;
    }

    public void incrementPatientsTransported() {
        this.patientsTransported++;
    }
}
