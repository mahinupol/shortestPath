package com.smartcity.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Centralized exception handler providing friendly JSON error payloads.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RoadBlockedException.class)
    public ResponseEntity<Map<String, Object>> handleRoadBlocked(RoadBlockedException ex) {
        return buildResponse(HttpStatus.CONFLICT, "ROAD_BLOCKED", ex.getMessage());
    }

    @ExceptionHandler(VehicleNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleVehicleNotFound(VehicleNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "VEHICLE_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(EmergencyNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEmergencyNotFound(EmergencyNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "EMERGENCY_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(InvalidRouteException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidRoute(InvalidRouteException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "INVALID_ROUTE", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String errorCode, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("errorCode", errorCode);
        body.put("message", message != null ? message : "An unexpected simulation error occurred.");
        return ResponseEntity.status(status).body(body);
    }
}
