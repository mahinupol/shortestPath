package com.smartcity.model.core;

import com.smartcity.model.enums.EmergencyType;
import com.smartcity.model.enums.VehicleType;

/**
 * Concrete Emergency Vehicle: Fire Truck.
 * Dispatched from Fire Stations for structural and hazard fire incidents.
 */
public class FireTruck extends EmergencyVehicle {
    private double waterTankCapacityLiters = 4000.0;

    public FireTruck(String id, String name, double baseSpeed,
                     double startX, double startY, String initialNodeId, String fireStationNodeId) {
        super(id, name, VehicleType.FIRE_TRUCK, baseSpeed, startX, startY, initialNodeId, fireStationNodeId);
    }

    @Override
    public int calculatePriority() {
        return 10; // Maximum urgency due to catastrophic life and infrastructure risk
    }

    @Override
    public double getSpeedMultiplier() {
        return 1.20; // Heavy high-torque engine
    }

    @Override
    public String getVehicleIcon() {
        return "fire_truck";
    }

    @Override
    public EmergencyType getEmergencyType() {
        return EmergencyType.FIRE;
    }

    public double getWaterTankCapacityLiters() {
        return waterTankCapacityLiters;
    }
}
