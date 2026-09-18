package com.smartcity.model.core;

import com.smartcity.model.enums.EmergencyStatus;
import com.smartcity.model.enums.EmergencyType;

import java.time.Instant;

/**
 * Abstract class representing city emergency events.
 * Encapsulates origin, destination, assigned responder vehicle, timing, and lifecycle status.
 */
public abstract class AbstractEmergency {
    private String id;
    private EmergencyType type;
    private String title;
    private String description;
    private String sourceNodeId; // Origin dispatch station
    private String targetNodeId; // Incident scene
    private EmergencyStatus status;
    private String assignedVehicleId;
    private long startTimeEpoch;
    private Long resolvedTimeEpoch;
    private double etaSeconds;
    private double routeDistance;

    public AbstractEmergency(String id, EmergencyType type, String title, String description,
                             String sourceNodeId, String targetNodeId) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.status = EmergencyStatus.PENDING;
        this.startTimeEpoch = Instant.now().getEpochSecond();
        this.resolvedTimeEpoch = null;
        this.etaSeconds = 0.0;
        this.routeDistance = 0.0;
    }

    /**
     * Polymorphic severity score for analytics and prioritization.
     */
    public abstract int getSeverityWeight();

    public void markResolved() {
        this.status = EmergencyStatus.RESOLVED;
        this.resolvedTimeEpoch = Instant.now().getEpochSecond();
    }

    public long getResponseDurationSeconds() {
        if (resolvedTimeEpoch == null) {
            return Instant.now().getEpochSecond() - startTimeEpoch;
        }
        return resolvedTimeEpoch - startTimeEpoch;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public EmergencyType getType() {
        return type;
    }

    public void setType(EmergencyType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSourceNodeId() {
        return sourceNodeId;
    }

    public void setSourceNodeId(String sourceNodeId) {
        this.sourceNodeId = sourceNodeId;
    }

    public String getTargetNodeId() {
        return targetNodeId;
    }

    public void setTargetNodeId(String targetNodeId) {
        this.targetNodeId = targetNodeId;
    }

    public EmergencyStatus getStatus() {
        return status;
    }

    public void setStatus(EmergencyStatus status) {
        this.status = status;
    }

    public String getAssignedVehicleId() {
        return assignedVehicleId;
    }

    public void setAssignedVehicleId(String assignedVehicleId) {
        this.assignedVehicleId = assignedVehicleId;
    }

    public long getStartTimeEpoch() {
        return startTimeEpoch;
    }

    public void setStartTimeEpoch(long startTimeEpoch) {
        this.startTimeEpoch = startTimeEpoch;
    }

    public Long getResolvedTimeEpoch() {
        return resolvedTimeEpoch;
    }

    public void setResolvedTimeEpoch(Long resolvedTimeEpoch) {
        this.resolvedTimeEpoch = resolvedTimeEpoch;
    }

    public double getEtaSeconds() {
        return etaSeconds;
    }

    public void setEtaSeconds(double etaSeconds) {
        this.etaSeconds = etaSeconds;
    }

    public double getRouteDistance() {
        return routeDistance;
    }

    public void setRouteDistance(double routeDistance) {
        this.routeDistance = routeDistance;
    }
}
