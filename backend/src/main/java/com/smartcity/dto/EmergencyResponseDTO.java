package com.smartcity.dto;

import com.smartcity.model.core.AbstractEmergency;
import com.smartcity.model.enums.EmergencyStatus;
import com.smartcity.model.enums.EmergencyType;

public class EmergencyResponseDTO {
    private String id;
    private String title;
    private String description;
    private EmergencyType type;
    private String sourceNodeId;
    private String targetNodeId;
    private EmergencyStatus status;
    private String assignedVehicleId;
    private long startTimeEpoch;
    private Long resolvedTimeEpoch;
    private double etaSeconds;
    private double routeDistance;
    private long responseDurationSeconds;
    private int severityWeight;

    public EmergencyResponseDTO() {
    }

    public static EmergencyResponseDTO fromDomain(AbstractEmergency e) {
        if (e == null) return null;
        EmergencyResponseDTO dto = new EmergencyResponseDTO();
        dto.setId(e.getId());
        dto.setTitle(e.getTitle());
        dto.setDescription(e.getDescription());
        dto.setType(e.getType());
        dto.setSourceNodeId(e.getSourceNodeId());
        dto.setTargetNodeId(e.getTargetNodeId());
        dto.setStatus(e.getStatus());
        dto.setAssignedVehicleId(e.getAssignedVehicleId());
        dto.setStartTimeEpoch(e.getStartTimeEpoch());
        dto.setResolvedTimeEpoch(e.getResolvedTimeEpoch());
        dto.setEtaSeconds(Math.round(e.getEtaSeconds() * 10.0) / 10.0);
        dto.setRouteDistance(Math.round(e.getRouteDistance() * 10.0) / 10.0);
        dto.setResponseDurationSeconds(e.getResponseDurationSeconds());
        dto.setSeverityWeight(e.getSeverityWeight());
        return dto;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public EmergencyType getType() {
        return type;
    }

    public void setType(EmergencyType type) {
        this.type = type;
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

    public long getResponseDurationSeconds() {
        return responseDurationSeconds;
    }

    public void setResponseDurationSeconds(long responseDurationSeconds) {
        this.responseDurationSeconds = responseDurationSeconds;
    }

    public int getSeverityWeight() {
        return severityWeight;
    }

    public void setSeverityWeight(int severityWeight) {
        this.severityWeight = severityWeight;
    }
}
