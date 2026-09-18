package com.smartcity.patterns.factory;

import com.smartcity.model.core.*;
import com.smartcity.model.enums.VehicleType;

/**
 * Factory Pattern implementation for polymorphic vehicle instantiation.
 */
public class VehicleFactory {

    public static AbstractVehicle createVehicle(VehicleType type, String id, String name,
                                                double baseSpeed, double startX, double startY,
                                                String initialNodeId, String homeStationId) {
        if (type == null) {
            type = VehicleType.CAR;
        }

        return switch (type) {
            case AMBULANCE -> new Ambulance(id, name, baseSpeed, startX, startY, initialNodeId, homeStationId);
            case FIRE_TRUCK -> new FireTruck(id, name, baseSpeed, startX, startY, initialNodeId, homeStationId);
            case POLICE -> new PoliceVehicle(id, name, baseSpeed, startX, startY, initialNodeId, homeStationId);
            case CAR -> new NormalVehicle(id, name, baseSpeed, startX, startY, initialNodeId);
        };
    }
}
