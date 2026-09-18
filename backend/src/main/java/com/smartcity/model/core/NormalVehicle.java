package com.smartcity.model.core;

import com.smartcity.model.enums.VehicleType;

/**
 * Represents a standard civilian vehicle (car, taxi, commute vehicle).
 * Adheres to standard speed limits and waits at red traffic signals.
 */
public class NormalVehicle extends AbstractVehicle {

    public NormalVehicle(String id, String name, double baseSpeed,
                         double startX, double startY, String initialNodeId) {
        super(id, name, VehicleType.CAR, baseSpeed, startX, startY, initialNodeId);
    }

    @Override
    public int calculatePriority() {
        return 1;
    }

    @Override
    public double getSpeedMultiplier() {
        return 1.0;
    }

    @Override
    public boolean canPreemptTrafficLights() {
        return false;
    }

    @Override
    public String getVehicleIcon() {
        return "car";
    }
}
