package com.smartcity.exception;

public class EmergencyNotFoundException extends RuntimeException {
    public EmergencyNotFoundException(String emergencyId) {
        super("Emergency event with ID '" + emergencyId + "' was not found.");
    }
}
