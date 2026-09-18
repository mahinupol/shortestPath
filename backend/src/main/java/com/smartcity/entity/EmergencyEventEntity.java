package com.smartcity.entity;

import com.smartcity.model.enums.EmergencyStatus;
import com.smartcity.model.enums.EmergencyType;
import jakarta.persistence.*;

@Entity
@Table(name = "emergency_events")
public class EmergencyEventEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    private EmergencyType type;

    private String sourceNodeId;
    private String targetNodeId;

    @Enumerated(EnumType.STRING)
    private EmergencyStatus status;

    private String assignedVehicleId;
    private long startTimeEpoch;
    private Long resolvedTimeEpoch;
    private double routeDistance;

    public EmergencyEventEntity() {
    }

    public EmergencyEventEntity(String id, String title, String description, EmergencyType type,
                                String sourceNodeId, String targetNodeId, EmergencyStatus status,
                                String assignedVehicleId, long startTimeEpoch, Long resolvedTimeEpoch,
                                double routeDistance) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.status = status;
        this.assignedVehicleId = assignedVehicleId;
        this.startTimeEpoch = startTimeEpoch;
        this.resolvedTimeEpoch = resolvedTimeEpoch;
        this.routeDistance = routeDistance;
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

    public double getRouteDistance() {
        return routeDistance;
    }

    public void setRouteDistance(double routeDistance) {
        this.routeDistance = routeDistance;
    }
}
