package com.smartcity.exception;

public class VehicleNotFoundException extends RuntimeException {
    public VehicleNotFoundException(String vehicleId) {
        super("Vehicle with ID '" + vehicleId + "' was not found in the simulation.");
    }
}
